import { observeLanguageChange } from "../../i18n/useTranslation";

type Dispose = () => void;

/**
 * Tüm bileşenlerde tekrar eden dil dinleme ve yeniden render etme
 * mantığını merkezileştiren temel sınıf. Alt sınıflar sadece
 * `renderComponent` ve opsiyonel olarak `afterRender` / `onConnected`
 * / `onDisconnected` / `onLanguageChanged` metodlarını override eder.
 */
export abstract class LocalizedComponent extends HTMLElement {
	private disposeLanguageListener: Dispose | null = null;

	connectedCallback(): void {
		this.renderAndBind();
		this.observeLanguage();
		this.onConnected();
	}

	disconnectedCallback(): void {
		if (this.disposeLanguageListener) {
			this.disposeLanguageListener();
			this.disposeLanguageListener = null;
		}
		this.onDisconnected();
	}

	protected onConnected(): void {
		// Alt sınıflar ihtiyaç halinde override edebilir
	}

	protected onDisconnected(): void {
		// Alt sınıflar ihtiyaç halinde override edebilir
	}

	protected onLanguageChanged(): void {
		// Varsayılan davranış yalnızca yeniden render etmek.
		// Alt sınıflar ek işlemler eklemek için override edebilir.
	}

	protected afterRender(): void {
		// Render sonrasında DOM üzerinde işlem yapmak isteyen bileşenler override eder.
	}

	protected abstract renderComponent(): void;

	protected renderAndBind(): void {
		this.renderComponent();
		this.afterRender();
	}

	private observeLanguage(): void {
		if (this.disposeLanguageListener) {
			this.disposeLanguageListener();
		}
		this.disposeLanguageListener = observeLanguageChange(() => {
			this.renderAndBind();
			this.onLanguageChanged();
		});
	}
}
