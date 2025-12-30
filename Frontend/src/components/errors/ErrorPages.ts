import { router } from "../../router/Router";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER_NARROW } from "../utils/Layout";

class ErrorPages extends LocalizedComponent {
	private errorType: string = "404";
	private errorTitleKey: string | null = "error_404_title";
	private errorTitleFallback: string | null = null;
	private errorDescriptionKey: string | null = "error_404_description";
	private errorDescriptionFallback: string | null = null;
	private sidebarListener: SidebarStateListener | null = null;

	static get observedAttributes() {
		return ["error-type", "error-title", "error-description"];
	}

	attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
		switch (name) {
			case "error-type":
				this.errorType = newValue || "404";
				this.applyDefaultKeys();
				break;
			case "error-title":
				this.setTitleKeys(newValue);
				break;
			case "error-description":
				this.setDescriptionKeys(newValue);
				break;
		}
		this.renderAndBind();
	}

	private applyDefaultKeys(): void {
		const { titleKey, descriptionKey } = ErrorPages.getErrorConfig(this.errorType);
		if (!this.errorTitleFallback) {
			this.errorTitleKey = titleKey;
		}
		if (!this.errorDescriptionFallback) {
			this.errorDescriptionKey = descriptionKey;
		}
	}

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
	}

	private setupEvents(): void {
		const goHomeBtn = this.querySelector("#goHomeBtn");
		goHomeBtn?.addEventListener("click", () => {
			router.navigate("/");
		});

		const goBackBtn = this.querySelector("#goBackBtn");
		goBackBtn?.addEventListener("click", () => {
			window.history.back();
		});

		const contactSupportBtn = this.querySelector("#contactSupportBtn");
		contactSupportBtn?.addEventListener("click", () => {
			alert(t("error_contact_support_alert"));
		});
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.adjustErrorPageMargin(state.isCollapsed);
		};

		sidebarStateManager.addListener(this.sidebarListener);
		
		// Initial state için margin'i ayarla
		this.adjustErrorPageMargin(sidebarStateManager.getState().isCollapsed);
	}

	private adjustErrorPageMargin(isCollapsed: boolean): void {
		const errorContainer = this.querySelector("#errorContainer");
		if (!errorContainer) return;

		const transitionClasses = sidebarStateManager.getTransitionClasses();
		errorContainer.classList.add(...transitionClasses);

		errorContainer.classList.add("ml-0");
		errorContainer.classList.toggle("md:ml-16", isCollapsed);
		errorContainer.classList.toggle("md:ml-72", !isCollapsed);
	}

	protected renderComponent(): void {
		this.innerHTML = `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<div class="min-h-screen flex items-center justify-center py-8 transition-all duration-300 min-w-0" id="errorContainer" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))">
					<div class="${APP_CONTAINER_NARROW} w-full mx-auto">
						<div class="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl p-6 sm:p-8 lg:p-10 text-center shadow-2xl border border-white/20">
							<div class="mb-6 lg:mb-8">
								<div class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-red-100 dark:bg-red-900/50 rounded-full mb-4 lg:mb-6">
									<span class="text-2xl sm:text-3xl lg:text-4xl">${this.getErrorIcon()}</span>
								</div>
								<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-red-600 dark:text-red-400 mb-3 lg:mb-4 tracking-tight">
									${t("error_code_template", { code: this.errorType })}
								</h1>
							</div>

							<div class="mb-6 lg:mb-8">
								<h2 class="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4 break-words">
									${this.getErrorTitle()}
								</h2>
								<p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-prose mx-auto break-words">
									${this.getErrorDescription()}
								</p>
							</div>

							<div class="space-y-3 lg:space-y-4">
								<button id="goHomeBtn" class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 lg:py-4 px-4 lg:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base min-h-[44px]" aria-label="${t("error_go_home_button")}">
									<span class="mr-2">🏠</span>
									${t("error_go_home_button")}
								</button>
								
								<button id="goBackBtn" class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 lg:py-4 px-4 lg:px-6 rounded-xl transition-all duration-200 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transform hover:scale-105 text-sm sm:text-base min-h-[44px]" aria-label="${t("error_go_back_button")}">
									<span class="mr-2">⬅️</span>
									${t("error_go_back_button")}
								</button>
							</div>

							<div class="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 dark:border-gray-700">
								<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
									${t("error_support_prompt")}
								</p>
								<button id="contactSupportBtn" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs sm:text-sm underline transition-colors">
									${t("error_contact_support")}
								</button>
							</div>
						</div>

						<div class="mt-4 lg:mt-6 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl p-4 lg:p-6 text-center border border-white/20">
							<h3 class="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 flex items-center justify-center">
								<span class="mr-2">🎮</span>
								${t("error_fun_facts_title")}
							</h3>
							<p class="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
								${this.getRandomFact()}
							</p>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.adjustErrorPageMargin(sidebarStateManager.getState().isCollapsed);
	}

	private getErrorIcon(): string {
		switch (this.errorType) {
			case "404":
				return "🔍";
			case "500":
				return "⚠️";
			case "403":
				return "🚫";
			case "401":
				return "🔒";
			default:
				return "❌";
		}
	}

	private getErrorTitle(): string {
		if (this.errorTitleKey) return t(this.errorTitleKey);
		if (this.errorTitleFallback) return this.errorTitleFallback;
		return t(ErrorPages.getErrorConfig(this.errorType).titleKey);
	}

	private getErrorDescription(): string {
		if (this.errorDescriptionKey) return t(this.errorDescriptionKey);
		if (this.errorDescriptionFallback) return this.errorDescriptionFallback;
		return t(ErrorPages.getErrorConfig(this.errorType).descriptionKey);
	}

	private getRandomFact(): string {
		const factKeys = [
			"error_fact_pong_1",
			"error_fact_pong_2",
			"error_fact_pong_3",
			"error_fact_pong_4",
			"error_fact_pong_5"
		];
		const randomKey = factKeys[Math.floor(Math.random() * factKeys.length)];
		return t(randomKey);
	}

	private setTitleKeys(value: string): void {
		if (!value) {
			this.errorTitleFallback = null;
			this.errorTitleKey = ErrorPages.getErrorConfig(this.errorType).titleKey;
			return;
		}
		if (value.startsWith("error_")) {
			this.errorTitleKey = value;
			this.errorTitleFallback = null;
		} else {
			this.errorTitleFallback = value;
			this.errorTitleKey = null;
		}
	}

	private setDescriptionKeys(value: string): void {
		if (!value) {
			this.errorDescriptionFallback = null;
			this.errorDescriptionKey = ErrorPages.getErrorConfig(this.errorType).descriptionKey;
			return;
		}
		if (value.startsWith("error_")) {
			this.errorDescriptionKey = value;
			this.errorDescriptionFallback = null;
		} else {
			this.errorDescriptionFallback = value;
			this.errorDescriptionKey = null;
		}
	}

	public setError(type: string, title: string, description: string): void {
		this.errorType = type;
		this.setTitleKeys(title);
		this.setDescriptionKeys(description);
		this.renderAndBind();
	}

	public static getErrorConfig(type: string): { titleKey: string; descriptionKey: string } {
		const configs: Record<string, { titleKey: string; descriptionKey: string }> = {
			"404": {
				titleKey: "error_404_title",
				descriptionKey: "error_404_description"
			},
			"500": {
				titleKey: "error_500_title",
				descriptionKey: "error_500_description"
			},
			"403": {
				titleKey: "error_403_title",
				descriptionKey: "error_403_description"
			},
			"401": {
				titleKey: "error_401_title",
				descriptionKey: "error_401_description"
			},
			"auth": {
				titleKey: "error_auth_title",
				descriptionKey: "error_auth_description"
			}
		};
		return configs[type] || configs["404"];
	}
}

customElements.define("error-page", ErrorPages);

export default ErrorPages;
