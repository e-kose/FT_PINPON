import { LocalizedComponent } from "../../base/LocalizedComponent";
import { t } from "../../../i18n/lang";
import "../../LoadingAniamtion";

export class Queue extends LocalizedComponent {
	protected renderComponent(): void {
		this.innerHTML = `
			<div class="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
				<div class="w-full max-w-xl rounded-3xl border border-slate-200/70 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/70 shadow-lg shadow-slate-900/10 dark:shadow-black/40 p-6 sm:p-8 lg:p-10">
					<div class="flex flex-col items-center justify-center text-center gap-5 sm:gap-6">
						<div class="w-14 h-14 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
							<svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"></path>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>

						<div class="flex flex-col items-center gap-3 max-w-full">
							<h2 id="queueStatus" class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-center max-w-full break-words whitespace-normal">
								${t('game_queue_searching')}
							</h2>
							<p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md break-words whitespace-normal">
								${t('game_queue_please_wait')}
							</p>
						</div>

						<div class="w-full flex items-center justify-center py-2">
							<div class="scale-110 sm:scale-125">
								<loading-animation></loading-animation>
							</div>
						</div>

						<div class="flex items-center justify-center gap-2">
							<span class="w-2 h-2 rounded-full bg-slate-400/80 animate-pulse" style="animation-delay: 0ms;"></span>
							<span class="w-2 h-2 rounded-full bg-slate-300/70 animate-pulse" style="animation-delay: 160ms;"></span>
							<span class="w-2 h-2 rounded-full bg-slate-400/80 animate-pulse" style="animation-delay: 320ms;"></span>
						</div>

						<button id="btnCancelQueue" class="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200/80 dark:hover:bg-slate-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
							<svg class="w-4 h-4 text-slate-500 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
							<span>${t('game_queue_cancel')}</span>
						</button>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.querySelector('#btnCancelQueue')?.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('queue-cancel', { bubbles: true }));
		});
	}

	public updateStatus(status: string, _payload: unknown): void {
		const sEl = this.querySelector('#queueStatus');
		if (sEl) sEl.textContent = status;
	}
}

customElements.define("game-queue", Queue);
