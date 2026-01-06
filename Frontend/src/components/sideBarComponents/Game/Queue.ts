import { LocalizedComponent } from "../../base/LocalizedComponent";
import { t } from "../../../i18n/lang";

export class Queue extends LocalizedComponent {
	protected renderComponent(): void {
		this.innerHTML = `
            <div class="flex flex-col items-center justify-center text-gray-100">
                <div class="loader w-24 h-24 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin mb-8"></div>
                <h2 id="queueStatus" class="text-2xl font-bold tracking-widest mb-8">${t('game_queue_searching')}</h2>
                <button id="btnCancelQueue" class="px-8 py-3 border border-white/20 rounded-full hover:bg-white/10 transition-colors tracking-widest">
                    ${t('game_queue_cancel')}
                </button>
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
