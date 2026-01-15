import { LocalizedComponent } from "../../base/LocalizedComponent";
import type { GameState } from "../../../types/GameTypes";
import { t } from "../../../i18n/lang";

export class GameArena extends LocalizedComponent {
	private ctx: CanvasRenderingContext2D | null = null;
	private isLocal: boolean = false;


	protected renderComponent(): void {
		this.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full relative">
                <div id="playerHUD" class="w-[800px] flex justify-between items-end mb-2 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg" id="avatarLeft">
                            P1
                        </div>
                        <div class="flex flex-col">
                             <span class="text-xs text-slate-400 mb-0.5">${t('game_arena_player_1')}</span>
                             <span id="nameLeft" class="text-lg text-white font-semibold">${t('game_arena_player_1')}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 flex-row-reverse text-right">
                        <div class="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-bold text-lg" id="avatarRight">
                            P2
                        </div>
                        <div class="flex flex-col">
                             <span class="text-xs text-slate-400 mb-0.5">${t('game_arena_player_2')}</span>
                             <span id="nameRight" class="text-lg text-white font-semibold">${t('game_arena_player_2')}</span>
                        </div>
                    </div>
                </div>

                <div class="relative">
                    <div class="absolute top-4 w-full flex justify-center pointer-events-none z-10">
                         <div class="flex gap-8 px-8 py-2 bg-slate-900/80 rounded-xl backdrop-blur-sm border border-slate-700/50">
                            <span id="scoreLeft" class="text-4xl font-bold text-white">0</span>
                            <span class="text-4xl font-bold text-slate-500">-</span>
                            <span id="scoreRight" class="text-4xl font-bold text-white">0</span>
                        </div>
                    </div>

                    <canvas id="gameCanvas" width="800" height="600" class="bg-black rounded-lg border border-slate-800"></canvas>

                    <!-- Game Over Overlay -->
                    <div id="gameOverlay" class="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 z-20">
                        <div class="w-[min(90vw,400px)] rounded-2xl border border-slate-700/50 bg-slate-900/95 p-8">
                            <div class="flex flex-col items-center text-center">
                                
                                <!-- Result Icon -->
                                <div id="overlayIcon" class="mb-4 w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                
                                <!-- Title -->
                                <div id="overlayTitle" class="text-2xl font-bold text-white mb-2">${t('game_arena_game_over')}</div>
                                
                                <!-- Subtitle -->
                                <div id="overlaySubtitle" class="text-sm text-slate-400 mb-6"></div>
                                
                                <!-- Score Display -->
                                <div id="overlayScore" class="hidden mb-6 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-bold text-cyan-400">0</span>
                                        <span class="text-lg text-slate-500">-</span>
                                        <span class="text-2xl font-bold text-fuchsia-400">0</span>
                                    </div>
                                </div>
                                
                                <!-- Continue Button -->
                                <button id="btnOverlayContinue" class="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500">
                                    ${t('game_arena_continue')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3 text-slate-500 text-xs tracking-wide">${t('game_arena_controls')}</div>
            </div>
        `;
	}

	protected afterRender(): void {
		const canvas = this.querySelector('#gameCanvas') as HTMLCanvasElement;
		if (canvas) {
			this.ctx = canvas.getContext('2d');
		}

		this.querySelector('#btnOverlayContinue')?.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('game-continue', { bubbles: true }));
		});
	}

	public setLocalMode(isLocal: boolean): void {
		if (this.isLocal === isLocal) return;
		this.isLocal = isLocal;
		const hud = this.querySelector('#playerHUD');
		if (hud) {
			if (isLocal) hud.classList.add('hidden');
			else hud.classList.remove('hidden');
		}
	}

	public renderGame(state: GameState): void {
		if (!this.ctx) return;
		const ctx = this.ctx;

		const scoreLeft = this.querySelector('#scoreLeft');
		const scoreRight = this.querySelector('#scoreRight');
		const nameLeft = this.querySelector('#nameLeft');
		const nameRight = this.querySelector('#nameRight');

		if (state.players?.left) {
			if (scoreLeft && state.players.left.score !== undefined) scoreLeft.textContent = state.players.left.score.toString();
			if (!this.isLocal && nameLeft && state.players.left.id) nameLeft.textContent = state.players.left.username;
		}

		if (state.players?.right) {
			if (scoreRight && state.players.right.score !== undefined) scoreRight.textContent = state.players.right.score.toString();
			if (!this.isLocal && nameRight && state.players.right.id) nameRight.textContent = state.players.right.username;
		}

		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, 800, 600);

		ctx.strokeStyle = '#222';
		ctx.lineWidth = 2;
		ctx.beginPath();
		for (let i = 0; i < 800; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, 600); }
		for (let i = 0; i < 600; i += 40) { ctx.moveTo(0, i); ctx.lineTo(800, i); }
		ctx.stroke();

		ctx.strokeStyle = '#00f3ff';
		ctx.setLineDash([10, 20]);
		ctx.shadowBlur = 10; ctx.shadowColor = '#00f3ff';
		ctx.beginPath();
		ctx.moveTo(400, 0); ctx.lineTo(400, 600);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.shadowBlur = 0;

		if (state.players?.left?.paddle) {
			ctx.fillStyle = '#00f3ff';
			ctx.shadowBlur = 15; ctx.shadowColor = '#00f3ff';
			ctx.fillRect(20, state.players.left.paddle.y, 10, 100);
		}

		if (state.players?.right?.paddle) {
			ctx.fillStyle = '#bd00ff';
			ctx.shadowBlur = 15; ctx.shadowColor = '#bd00ff';
			ctx.fillRect(770, state.players.right.paddle.y, 10, 100);
		}

		if (state.ball) {
			ctx.fillStyle = '#fff';
			ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
			ctx.beginPath();
			ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;
		}
	}

	public showOverlay(payload: any): void {
		const overlay = this.querySelector('#gameOverlay');
		const title = this.querySelector('#overlayTitle');
		const subtitle = this.querySelector('#overlaySubtitle');
		const icon = this.querySelector('#overlayIcon');
		const scoreEl = this.querySelector('#overlayScore');

		// Determine result type
		const isVictory = payload.title === t('game_status_victory');
		const isDefeat = payload.title === t('game_status_defeat');

		// Update icon based on result
		if (icon) {
			let iconClass = "mb-4 w-16 h-16 rounded-xl flex items-center justify-center";
			let svgContent = `<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
			
			if (isVictory) {
				iconClass += " bg-emerald-900/40 border border-emerald-500/30";
				svgContent = `<svg class="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 9.65 16.65 11 15 11H14.82C14.4 12.84 12.87 14.14 11 14.14V16H14V18H17V20H7V18H10V16H9V14.14C7.13 14.14 5.6 12.84 5.18 11H5C3.35 11 2 9.65 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12Z"/></svg>`;
			} else if (isDefeat) {
				iconClass += " bg-rose-900/40 border border-rose-500/30";
				svgContent = `<svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
			} else {
				iconClass += " bg-slate-800 border border-slate-700";
			}
			
			icon.className = iconClass;
			icon.innerHTML = svgContent;
		}

		// Update title
		if (title) {
			title.textContent = payload.title || t('game_arena_game_over');
			let titleClass = "text-2xl font-bold mb-2";
			
			if (isVictory) {
				titleClass += " text-emerald-400";
			} else if (isDefeat) {
				titleClass += " text-rose-400";
			} else {
				titleClass += " text-white";
			}
			
			title.className = titleClass;
		}

		// Update subtitle
		if (subtitle) {
			const fallbackMessage = t("game_arena_winner_label", { winner: payload.winnerId ?? "-" });
			subtitle.textContent = payload.message || fallbackMessage;
		}

		// Show score if available (for local games)
		if (scoreEl && payload.finalScore) {
			const scoreSpans = scoreEl.querySelectorAll('span');
			if (scoreSpans.length >= 3) {
				scoreSpans[0].textContent = String(payload.finalScore.left ?? 0);
				scoreSpans[2].textContent = String(payload.finalScore.right ?? 0);
			}
			scoreEl.classList.remove('hidden');
		} else if (scoreEl) {
			scoreEl.classList.add('hidden');
		}

		// Show overlay
		overlay?.classList.remove('opacity-0', 'pointer-events-none');
	}

	public closeOverlay(): void {
		const overlay = this.querySelector('#gameOverlay');
		overlay?.classList.add('opacity-0', 'pointer-events-none');
	}
}

customElements.define("game-arena", GameArena);
