import { LocalizedComponent } from "../../base/LocalizedComponent";
import { getUser } from "../../../store/UserStore";
import { sidebarStateManager } from "../../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../../router/SidebarStateManager";
import { t } from "../../../i18n/lang";
import { gameWebSocketService } from "../../../services/GameWebSocketService";
import "../../utils/SideBar"; // Ensure SideBar is registered
import "../../utils/Header";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "../../utils/Layout";


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
	private statusTimeout: ReturnType<typeof setTimeout> | null = null;
	private lastSendErrorAt = 0;

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

		if (this.statusTimeout) {
			clearTimeout(this.statusTimeout);
			this.statusTimeout = null;
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
            <style>
                .status-toast {
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: opacity 220ms ease, transform 240ms ease, box-shadow 240ms ease;
                    pointer-events: none;
                }
                .status-toast.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .status-toast[data-variant="success"] {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(14, 116, 144, 0.18));
                    border-color: rgba(16, 185, 129, 0.4);
                    color: #bbf7d0;
                }
                .status-toast[data-variant="warning"] {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.18), rgba(249, 115, 22, 0.18));
                    border-color: rgba(251, 191, 36, 0.4);
                    color: #fde68a;
                }
                .status-toast[data-variant="danger"] {
                    background: linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(244, 63, 94, 0.18));
                    border-color: rgba(248, 113, 113, 0.45);
                    color: #fecaca;
                }
            </style>
            <div class="min-h-screen bg-gray-900 bg-[url('/DashboardBackground.jpg')] bg-cover bg-center bg-fixed">
                <header-component></header-component>
                <div class="${PAGE_TOP_OFFSET}">
                    <sidebar-component current-route="game"></sidebar-component>
                    <div id="mainContent" class="${sidebarStateManager.getMarginClass()} ${MAIN_CONTENT_SCROLL} min-w-0 flex flex-col">
                        <div class="${APP_CONTAINER} flex-1 flex flex-col justify-center items-center">
                            <!-- STATUS BAR -->
                            <div id="statusBar" role="status" aria-live="polite" class="status-toast fixed top-36 right-6 z-50 max-w-[90vw] sm:max-w-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:text-sm font-medium text-white/80 shadow-lg shadow-black/30 backdrop-blur-md">
                                ${t('game_status_connecting')}
                            </div>

                            <!-- SCREENS -->
                            <game-dashboard id="screen-dashboard" class="w-full"></game-dashboard>
                            <game-queue id="screen-queue" class="hidden w-full"></game-queue>
                            <game-bracket id="screen-bracket" class="hidden w-full"></game-bracket>
                            <game-arena id="screen-game" class="hidden w-full"></game-arena>
                        </div>
                    </div>
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

		this.updateStatus(t('game_status_connecting'), 'info', 4500);

		gameWebSocketService.connect();

		gameWebSocketService.addListener({
			onOpen: () => {
				this.updateStatus(t('game_status_connected'), 'success', 4500);
			},
			onClose: () => {
				this.updateStatus(t('game_status_disconnected'), 'warning', 6000);
				this.gameMode = null;
				this.switchScreen('dashboard');
			},
			onError: (err) => {
				this.updateStatus(t('game_status_error'), 'danger', 6500);
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
		const sent = gameWebSocketService.sendMessage(type, payload);
		if (!sent && type !== 'PLAYER_INPUT') {
			const now = Date.now();
			if (now - this.lastSendErrorAt > 4000) {
				this.lastSendErrorAt = now;
				this.updateStatus(t('game_status_connection_failed_refresh'), 'danger', 6500);
			}
		}
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
							bracket?.updateStatus(t('game_bracket_champion'), true, 'return', 'success');
						} else {
							bracket?.updateStatus(t('game_bracket_won_by', { username: winnerName }), true, 'return', 'info');
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
			bracket?.updateStatus(t('game_bracket_victory'), false, 'leave', 'success');
		} else {
			bracket?.updateStatus(t('game_bracket_eliminated', { username: data.winnerUsername }), true, 'leave', 'danger');
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

	private updateStatus(text: string, variant: 'info' | 'success' | 'warning' | 'danger' = 'info', duration = 4500): void {
		const el = this.querySelector('#statusBar');
		if (!el) return;

		el.textContent = text;
		el.setAttribute('data-variant', variant);
		el.classList.add('is-visible');

		if (this.statusTimeout) {
			clearTimeout(this.statusTimeout);
		}
		this.statusTimeout = setTimeout(() => {
			el.classList.remove('is-visible');
		}, duration);
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

		const transitionClasses = sidebarStateManager.getTransitionClasses();
		mainContent.classList.add(...transitionClasses);
		mainContent.classList.add('ml-0');
		mainContent.classList.toggle('md:ml-72', !isCollapsed);
		mainContent.classList.toggle('md:ml-16', isCollapsed);
	}
}

customElements.define("game-component", Game);
export default Game;
