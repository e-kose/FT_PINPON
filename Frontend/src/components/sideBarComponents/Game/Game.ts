import { LocalizedComponent } from "../../base/LocalizedComponent";
import { getUser } from "../../../store/UserStore";
import { sidebarStateManager } from "../../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../../router/SidebarStateManager";
import { t } from "../../../i18n/lang";
import { gameWebSocketService } from "../../../services/GameWebSocketService";
import "../../utils/SideBar"; // Ensure SideBar is registered


import "./Dashboard";
import "./Queue";
import "./Bracket";
import "./GameArena";
import type { Queue } from "./Queue";
import type { Bracket } from "./Bracket";
import type { GameArena } from "./GameArena";
import type { GameState, GameOverPayload, GameMessage } from "../../../types/GameTypes";


export class Game extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private currentScreen: 'dashboard' | 'queue' | 'bracket' | 'game' = 'dashboard';
	private gameMode: 'local' | 'online' | 'tournament' | null = null;
	private connectTimeout: ReturnType<typeof setTimeout> | null = null;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		window.addEventListener('keydown', this.handleKeyDown.bind(this));
		window.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}

		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
			this.connectTimeout = null;
		}

		this.disconnect();
		window.removeEventListener('keydown', this.handleKeyDown.bind(this));
		window.removeEventListener('keyup', this.handleKeyUp.bind(this));
	}

	protected renderComponent(): void {
		const user = getUser();
		if (!user) {
			this.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                    <p>${t("settings_login_required_description")}</p>
                </div>`;
			return;
		}

		this.innerHTML = `
            <div class="game-page-container w-full min-h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden relative">
                <!-- SIDEBAR -->
                <sidebar-component></sidebar-component>

                <!-- STATUS BAR -->
                <div id="statusBar" class="fixed bottom-4 right-4 bg-black/80 px-4 py-2 rounded-full text-xs text-white/50 z-50">
                    Connecting...
                </div>

                <!-- MAIN CONTENT WRAPPER -->
                <div id="mainContent" class="transition-all duration-300 w-full h-full flex flex-col items-center justify-center pt-20">
                    <game-dashboard id="screen-dashboard" class="w-full"></game-dashboard>
                    <game-queue id="screen-queue" class="hidden w-full"></game-queue>
                    <game-bracket id="screen-bracket" class="hidden w-full"></game-bracket>
                    <game-arena id="screen-game" class="hidden w-full h-full"></game-arena>
                </div>
            </div>
        `;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.adjustMainContentMargin(sidebarStateManager.getState().isCollapsed);

		// Connect WS after render with a small delay to ensure previous socket is cleaned up on refresh
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		this.connectTimeout = setTimeout(() => {
			this.connect();
		}, 1000);
	}

	private setupEvents(): void {
		// Dashboard Events
		const dashboard = this.querySelector('game-dashboard') as HTMLElement;
		dashboard?.addEventListener('mode-select', (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail.mode === 'local') {
				this.sendMessage('CREATE_LOCAL_GAME');
			} else if (detail.mode === 'matchmaking') {
				this.gameMode = 'online';
				this.sendMessage('JOIN_MATCHMAKING');
			} else if (detail.mode === 'tournament') {
				this.gameMode = 'tournament';
				this.sendMessage('JOIN_TOURNAMENT_QUEUE', { size: detail.size });
			}
		});

		// Queue Events
		const queue = this.querySelector('game-queue') as HTMLElement;
		queue?.addEventListener('queue-cancel', () => {
			if (this.gameMode === 'online') {
				this.sendMessage('LEAVE_MATCHMAKING');
			} else if (this.gameMode === 'tournament') {
				this.sendMessage('LEAVE_TOURNAMENT_QUEUE');
			}
			this.gameMode = null;
			this.switchScreen('dashboard');
		});

		// Game Arena Events
		const arena = this.querySelector('game-arena') as HTMLElement;
		arena?.addEventListener('game-continue', () => {
			(arena as GameArena).closeOverlay();
			this.switchScreen('dashboard');
		});



		// Bracket Events
		const bracket = this.querySelector('game-bracket') as HTMLElement;
		bracket?.addEventListener('return-dashboard', () => {
			this.gameMode = null;
			this.switchScreen('dashboard');
		});
	}

	// --- WebSocket Logic ---

	private connect(): void {
		const user = getUser();
		if (!user) return;

		this.updateStatus(t('game_status_connecting'));

		gameWebSocketService.connect();

		gameWebSocketService.addListener({
			onOpen: () => {
				this.updateStatus(t('game_status_connected'));
			},
			onClose: () => {
				this.updateStatus(t('game_status_disconnected'));
				this.gameMode = null;
				this.switchScreen('dashboard');
			},
			onError: (err) => {
				console.error("WS Error", err);
				this.updateStatus(t('game_status_error'));
			},
			onMessage: (msg) => {
				this.handleMessage(msg);
			}
		});
	}

	private disconnect(): void {
		gameWebSocketService.disconnect();
	}

	private sendMessage(type: any, payload?: any): void {
		gameWebSocketService.sendMessage(type, payload);
	}

	private handleMessage(msg: GameMessage): void {
		switch (msg.type) {
			case 'MATCHMAKING_SEARCHING':
				this.switchScreen('queue');
				this.updateQueueStatus(t('game_queue_searching'), msg.payload);
				break;
			case 'TOURNAMENT_QUEUE_JOINED':
				this.switchScreen('queue');
				this.updateQueueStatus(t('game_queue_waiting_tournament'), null);
				break;
				break;
			case 'TOURNAMENT_QUEUE_LEFT':
			case 'LEAVE_TOURNAMENT':
				this.gameMode = null;
				this.switchScreen('dashboard');
				break;
			case 'TOURNAMENT_CREATED':
				this.gameMode = 'tournament';
				this.switchScreen('bracket');
				break;
			case 'TOURNAMENT_STATE':
				// Strict guard: If we are not in tournament mode, ignore state updates.
				// This prevents the bracket from reappearing if the backend sends late updates
				// or if the user is in a different flow.
				if (this.gameMode !== 'tournament') return;

				this.renderBracket(msg.payload.tournament);
				// If we are not in an active game, show the bracket
				// Also if the tournament is finished, show bracket
				if (this.currentScreen !== 'game' || msg.payload.tournament.state === 'finished') {
					this.switchScreen('bracket');

					const tourney = msg.payload.tournament;
					if (tourney.state === 'finished' && tourney.bracket.winnerId) {
						const winnerId = tourney.bracket.winnerId;
						const myId = String(getUser()?.id);
						const bracket = this.querySelector('game-bracket') as Bracket;

						const winner = tourney.players.find((p: any) => p.id === winnerId);
						const winnerName = winner ? winner.username : winnerId;

						if (winnerId === myId) {
							bracket?.updateStatus(t('game_bracket_champion'), true, 'return');
						} else {
							bracket?.updateStatus(t('game_bracket_won_by', { username: winnerName }), true, 'return');
						}
					}
				}
				break;
			case 'MATCH_FOUND':
				if (this.gameMode !== 'tournament') this.gameMode = 'online';
				this.switchScreen('game');
				break;
			case 'ROOM_CREATED':
				this.gameMode = 'local';
				this.switchScreen('game');
				break;
			case 'GAME_STATE':
			case 'STATE_UPDATE':
				if (this.currentScreen !== 'game') this.switchScreen('game');
				this.renderGame(msg.payload);
				break;
			case 'GAME_OVER':
				if (this.gameMode === 'tournament') {
					this.handleTournamentGameOver(msg.payload);
				} else if (this.gameMode === 'local') {
					let subtitle = t('game_arena_game_finished');
					if (msg.payload.finalScore) {
						const leftScore = msg.payload.finalScore.left;
						const rightScore = msg.payload.finalScore.right;
						subtitle = `${leftScore} - ${rightScore}`;
					}
					this.showOverlay({ ...msg.payload, title: t('game_arena_game_over'), message: subtitle });
				} else if (this.gameMode === 'online') {
					const myId = String(getUser()?.id);
					const isWinner = msg.payload.winnerId === myId;
					const title = isWinner ? t('game_status_victory') : t('game_status_defeat');
					let message = "";

					if (isWinner) {
						message = t('game_status_victory_msg', { username: msg.payload.loserUsername });
					} else {
						message = t('game_status_defeat_msg', { username: msg.payload.winnerUsername });
					}

					this.showOverlay({ ...msg.payload, title, message });
				}
				break;
			case 'ERROR':
				console.error(msg.payload);
				if (this.currentScreen === 'queue') this.switchScreen('dashboard');
				break;
		}
	}

	private handleTournamentGameOver(data: GameOverPayload): void {
		const myId = String(getUser()?.id);
		const isWinner = data.winnerId === myId;
		const bracket = this.querySelector('game-bracket') as Bracket;

		this.switchScreen('bracket');

		if (isWinner) {
			bracket?.updateStatus(t('game_bracket_victory'), false);
		} else {
			bracket?.updateStatus(t('game_bracket_eliminated', { username: data.winnerUsername }), true, 'leave');
		}
	}

	// --- UI Logic ---

	private switchScreen(screen: 'dashboard' | 'queue' | 'bracket' | 'game'): void {
		this.currentScreen = screen;
		const screens = ['dashboard', 'queue', 'bracket', 'game'];

		screens.forEach((s) => {
			const el = this.querySelector(`#screen-${s}`);
			if (el) {
				if (s === screen) {
					el.classList.remove('hidden');
				} else {
					el.classList.add('hidden');
				}
			}
		});
	}

	private updateStatus(text: string): void {
		const el = this.querySelector('#statusBar');
		if (el) el.textContent = text;
	}

	private updateQueueStatus(status: string, payload: any): void {
		const queue = this.querySelector('game-queue') as Queue;
		if (queue && typeof queue.updateStatus === 'function') {
			queue.updateStatus(status, payload);
		}
	}

	private renderGame(state: GameState): void {
		const arena = this.querySelector('game-arena') as GameArena;
		if (arena && typeof arena.renderGame === 'function') {
			const isLocal = this.gameMode === 'local';
			arena.setLocalMode(isLocal);
			arena.renderGame(state);
		}
	}

	private renderBracket(tournament: any): void {
		const bracket = this.querySelector('game-bracket') as Bracket;
		if (bracket && typeof bracket.renderBracket === 'function') {
			bracket.renderBracket(tournament);
		}
	}

	private showOverlay(payload: any): void {
		const arena = this.querySelector('game-arena') as GameArena;
		if (arena && typeof arena.showOverlay === 'function') {
			arena.showOverlay(payload);
		}
	}

	// --- Interaction ---


	// --- Input Handling ---

	private pressedKeys = new Set<string>();
	private lastSentAction: string | null = null;
	private lastSentActionLeft: string | null = null;
	private lastSentActionRight: string | null = null;

	private handleKeyDown(e: KeyboardEvent): void {
		if (this.currentScreen !== 'game') return;

		if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
			e.preventDefault();
		}

		this.pressedKeys.add(e.key);
		this.processInput();
	}

	private handleKeyUp(e: KeyboardEvent): void {
		if (this.currentScreen !== 'game') return;

		this.pressedKeys.delete(e.key);
		this.processInput();
	}

	private processInput(): void {
		if (this.gameMode === 'local') {
			this.processLocalInput();
		} else if (this.gameMode === 'online' || this.gameMode === 'tournament') {
			this.processOnlineInput();
		}
	}

	private processOnlineInput(): void {
		let action = 'stop';

		const up = this.pressedKeys.has('w') || this.pressedKeys.has('W') || this.pressedKeys.has('ArrowUp');
		const down = this.pressedKeys.has('s') || this.pressedKeys.has('S') || this.pressedKeys.has('ArrowDown');

		if (up && !down) {
			action = 'move_up';
		} else if (down && !up) {
			action = 'move_down';
		}

		if (action !== this.lastSentAction) {
			this.sendMessage('PLAYER_INPUT', { action });
			this.lastSentAction = action;
		}
	}

	private processLocalInput(): void {
		let leftAction = 'stop';
		const leftUp = this.pressedKeys.has('w') || this.pressedKeys.has('W');
		const leftDown = this.pressedKeys.has('s') || this.pressedKeys.has('S');

		if (leftUp && !leftDown) leftAction = 'move_up';
		else if (leftDown && !leftUp) leftAction = 'move_down';

		if (leftAction !== this.lastSentActionLeft) {
			this.sendMessage('PLAYER_INPUT', { action: leftAction, playerPosition: 'left' });
			this.lastSentActionLeft = leftAction;
		}

		let rightAction = 'stop';
		const rightUp = this.pressedKeys.has('ArrowUp');
		const rightDown = this.pressedKeys.has('ArrowDown');

		if (rightUp && !rightDown) rightAction = 'move_up';
		else if (rightDown && !rightUp) rightAction = 'move_down';

		if (rightAction !== this.lastSentActionRight) {
			this.sendMessage('PLAYER_INPUT', { action: rightAction, playerPosition: 'right' });
			this.lastSentActionRight = rightAction;
		}
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => this.adjustMainContentMargin(state.isCollapsed);
		sidebarStateManager.addListener(this.sidebarListener);
	}

	private adjustMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector('#mainContent');
		if (!mainContent) return;

		if (isCollapsed) {
			mainContent.classList.remove('pl-72');
			mainContent.classList.add('pl-24');
		} else {
			mainContent.classList.remove('pl-24');
			mainContent.classList.add('pl-72');
		}
	}
}

customElements.define("game-component", Game);
export default Game;
