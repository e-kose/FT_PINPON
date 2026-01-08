import { LocalizedComponent } from "../../base/LocalizedComponent";
import { t } from "../../../i18n/lang";
import "../../LoadingAniamtion";

export class Queue extends LocalizedComponent {
	protected renderComponent(): void {
		this.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 sm:px-6 lg:px-8">
                <div class="w-full max-w-xl bg-slate-900/50 rounded-3xl border border-slate-700/30 shadow-xl p-10 sm:p-14 lg:p-20">
                    <div class="flex flex-col items-center justify-center text-center space-y-8">
                        
                        <!-- Loading Animation -->
                        <div class="w-full flex items-center justify-center py-6 sm:py-8">
                            <div class="transform scale-125 sm:scale-150 lg:scale-[1.75]">
                                <loading-animation></loading-animation>
                            </div>
                        </div>
                        
                        <!-- Status Text -->
                        <div class="space-y-3">
                            <h2 id="queueStatus" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider uppercase">
                                ${t('game_queue_searching')}
                            </h2>
                            <p class="text-sm sm:text-base text-slate-300 font-medium">
                                ${t('game_queue_please_wait')}
                            </p>
                        </div>
                        
                        <!-- Animated Dots -->
                        <div class="flex items-center justify-center gap-2">
                            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-300 rounded-full animate-bounce" style="animation-delay: 0ms;"></span>
                            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-200 rounded-full animate-bounce" style="animation-delay: 150ms;"></span>
                            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-300 rounded-full animate-bounce" style="animation-delay: 300ms;"></span>
                        </div>
                        
                        <!-- Cancel Button -->
                        <button id="btnCancelQueue" class="group mt-4 px-8 sm:px-10 py-3.5 sm:py-4 bg-slate-800/60 border border-slate-600/40 rounded-2xl text-slate-300 font-medium text-sm sm:text-base hover:border-slate-500/60 hover:bg-slate-700/50 hover:text-slate-100 transition-all duration-300 flex items-center gap-3">
                            <svg class="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
