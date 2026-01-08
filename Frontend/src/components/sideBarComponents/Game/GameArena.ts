import { LocalizedComponent } from "../../base/LocalizedComponent";
import type { GameState } from "../../../types/GameTypes";
import { t } from "../../../i18n/lang";

export class GameArena extends LocalizedComponent {
	private ctx: CanvasRenderingContext2D | null = null;
	private isLocal: boolean = false;


	protected renderComponent(): void {
		this.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full relative">
                <div id="playerHUD" class="w-[800px] flex justify-between items-end mb-2 px-4 shadow-xl">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center text-black font-bold text-2xl uppercase border-2 border-white/20" id="avatarLeft">
                            👤
                        </div>
                        <div class="flex flex-col">
                             <span class="text-xs text-cyan-400 font-bold tracking-widest mb-1">${t('game_arena_player_1')}</span>
                             <span id="nameLeft" class="text-2xl text-white font-black tracking-wider text-shadow font-orbitron">${t('game_arena_player_1')}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 flex-row-reverse text-right">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 shadow-[0_0_15px_rgba(192,38,211,0.5)] flex items-center justify-center text-black font-bold text-2xl uppercase border-2 border-white/20" id="avatarRight">
                            👤
                        </div>
                        <div class="flex flex-col">
                             <span class="text-xs text-fuchsia-400 font-bold tracking-widest mb-1">${t('game_arena_player_2')}</span>
                             <span id="nameRight" class="text-2xl text-white font-black tracking-wider text-shadow font-orbitron">${t('game_arena_player_2')}</span>
                        </div>
                    </div>
                </div>

                <div class="relative">
                    <div class="absolute top-6 w-full flex justify-center pointer-events-none z-10">
                         <div class="flex gap-12 px-10 py-2 bg-black/60 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                            <span id="scoreLeft" class="text-5xl font-black text-white font-orbitron drop-shadow-md">0</span>
                            <span class="text-5xl font-black text-white/50 font-orbitron">-</span>
                            <span id="scoreRight" class="text-5xl font-black text-white font-orbitron drop-shadow-md">0</span>
                        </div>
                    </div>

                    <canvas id="gameCanvas" width="800" height="600" class="bg-black shadow-2xl rounded-sm"></canvas>

                    <div id="gameOverlay" class="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 z-20">
                        <div id="overlayTitle" class="text-6xl font-black text-white mb-4 text-shadow-glow font-orbitron">${t('game_arena_game_over')}</div>
                        <div id="overlaySubtitle" class="text-2xl text-white/70 mb-8"></div>
                        <button id="btnOverlayContinue" class="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1">
                            ${t('game_arena_continue')}
                        </button>
                    </div>
                </div>
                <div class="mt-4 text-white/40 text-sm tracking-widest">${t('game_arena_controls')}</div>
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

		if (title) {
			title.textContent = payload.title || t('game_arena_game_over');
			title.className = "text-6xl font-black mb-4 text-shadow-glow font-orbitron";
			if (payload.title === t('game_status_victory')) {
				title.classList.add("text-green-500");
			} else if (payload.title === t('game_status_defeat')) {
				title.classList.add("text-red-500");
			} else {
				title.classList.add("text-white");
			}
		}

		if (subtitle) {
			const fallbackMessage = t("game_arena_winner_label", { winner: payload.winnerId ?? "-" });
			subtitle.textContent = payload.message || fallbackMessage;
		}
		overlay?.classList.remove('opacity-0', 'pointer-events-none');
	}

	public closeOverlay(): void {
		const overlay = this.querySelector('#gameOverlay');
		overlay?.classList.add('opacity-0', 'pointer-events-none');
	}
}

customElements.define("game-arena", GameArena);
