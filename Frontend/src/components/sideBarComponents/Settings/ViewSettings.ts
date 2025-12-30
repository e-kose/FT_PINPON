import { Settings } from "./Settings";
import { getUser } from "../../../store/UserStore";
import { t, setLanguage, getLanguage, type SupportedLanguage } from "../../../i18n/lang";

const MESSAGE_CONTAINER = ".view-message-container";

class ViewSettings extends Settings {
	connectedCallback(): void {
		this.renderSection();
	}

	private renderSection(): void {
		const user = getUser();
		const currentLang = getLanguage();

		if (!user) {
			this.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">${t("view_settings_load_error_title")}</h2>
					<p class="text-gray-600 dark:text-gray-400">${t("view_settings_load_error_description")}</p>
				</div>
			`;
			return;
		}

		const languageStyles: Record<SupportedLanguage, {
			badgeClass: string;
			activeClass: string;
			inactiveClass: string;
			highlightClass: string;
			primaryKey: string;
			secondaryKey: string;
			gradientClass: string;
		}> = {
			tr: {
				badgeClass: "bg-red-500",
				activeClass: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
				inactiveClass: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
				highlightClass: "bg-red-500",
				primaryKey: "language_name_tr_native",
				secondaryKey: "language_name_tr_secondary",
				gradientClass: "from-red-500 to-red-600"
			},
			en: {
				badgeClass: "bg-blue-500",
				activeClass: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
				inactiveClass: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
				highlightClass: "bg-blue-500",
				primaryKey: "language_name_en_native",
				secondaryKey: "language_name_en_secondary",
				gradientClass: "from-blue-500 to-blue-600"
			},
			ku: {
				badgeClass: "bg-yellow-500",
				activeClass: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
				inactiveClass: "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
				highlightClass: "bg-yellow-500",
				primaryKey: "language_name_ku_native",
				secondaryKey: "language_name_ku_secondary",
				gradientClass: "from-yellow-500 to-amber-500"
			}
		};

		const currentMeta = languageStyles[currentLang];

		const languageOptions = (Object.entries(languageStyles) as Array<[SupportedLanguage, typeof currentMeta]>)
			.map(([code, meta]) => {
				const isActive = currentLang === code;
				const buttonClasses = isActive ? meta.activeClass : meta.inactiveClass;
				return `
					<button data-language="${code}" class="language-option w-full p-3 sm:p-4 rounded-lg border transition-all duration-200 ${buttonClasses} flex items-center space-x-3 sm:space-x-4 group">
						<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full ${meta.badgeClass} flex items-center justify-center shadow-sm flex-shrink-0">
							<span class="text-white font-bold text-xs sm:text-sm">${code.toUpperCase()}</span>
						</div>
						<div class="flex-1 text-left min-w-0">
							<h4 class="text-sm sm:text-base font-medium text-slate-900 dark:text-white truncate">${t(meta.primaryKey)}</h4>
							<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">${t(meta.secondaryKey)}</p>
						</div>
						${isActive ? `
							<div class="w-4 h-4 sm:w-5 sm:h-5 ${meta.highlightClass} rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
						` : ""}
					</button>
				`;
			})
			.join("");

		this.innerHTML = `
			<div class="space-y-4 sm:space-y-6">
				<div class="flex items-center space-x-2 sm:space-x-3">
					<div class="w-6 h-6 sm:w-8 sm:h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
						<svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
						</svg>
					</div>
					<h2 class="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-white">${t("view_settings_title")}</h2>
				</div>

				<!-- Mevcut Dil Gösterimi -->
				<div class="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border-2 border-emerald-200/60 dark:border-emerald-700/40 shadow-sm">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
						<div class="flex items-center space-x-3 sm:space-x-4">
							<div class="relative">
								<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${currentMeta.gradientClass} flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-white dark:ring-slate-800">
									<span class="text-white font-bold text-xs sm:text-sm">${currentLang.toUpperCase()}</span>
								</div>
								<div class="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-6 sm:h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
									<svg class="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
									</svg>
								</div>
							</div>
							<div>
								<h3 class="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white">
									${t(currentMeta.primaryKey)}
								</h3>
								<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
									${t("view_settings_current_language")}
								</p>
							</div>
						</div>
						<div class="flex flex-col items-start sm:items-end space-y-1 sm:space-y-2">
							<div class="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded-full text-[10px] sm:text-xs font-semibold border border-emerald-200 dark:border-emerald-700 shadow-sm">
								<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
								${t("view_settings_currently_active")}
							</div>
							<div class="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
								✓ ${t("view_settings_preferred_language")}
							</div>
						</div>
					</div>
				</div>

				<!-- Dil Seçenekleri -->
				<div class="space-y-3 sm:space-y-4">
					<div class="text-center">
						<h3 class="text-sm sm:text-base md:text-lg font-medium text-slate-900 dark:text-white mb-1 sm:mb-2">${t("view_settings_language_selection_title")}</h3>
						<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">${t("view_settings_language_description")}</p>
					</div>

					<div class="grid grid-cols-1 gap-2 sm:gap-3">
						${languageOptions}
					</div>

					<!-- Minimal Bilgilendirme -->
					<div class="mt-4 sm:mt-6 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
						<div class="flex items-start space-x-2 sm:space-x-3">
							<svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<div>
								<p class="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
									${t("view_settings_language_change_info_description")}
								</p>
							</div>
						</div>
					</div>
				</div>
				<div class="view-message-container"></div>
			</div>
		`;
		this.bindEvents();
	}

	private bindEvents(): void {
		this.querySelectorAll<HTMLButtonElement>(".language-option").forEach((button) => {
			button.addEventListener("click", () => {
				const language = button.getAttribute("data-language");
				if (language) this.changeLanguage(language as SupportedLanguage);
			});
		});
	}

	private changeLanguage(language: SupportedLanguage): void {
		const label = this.getLanguageLabel(language);
		console.log(t("view_settings_language_log", { language: label }));

		setLanguage(language);
		this.renderSection();

		this.showSuccessMessage(
			t("view_settings_language_success_title"),
			t("view_settings_language_success_message", { language: label }),
			MESSAGE_CONTAINER
		);
	}

	private getLanguageLabel(language: SupportedLanguage): string {
		const keys: Record<SupportedLanguage, string> = {
			tr: "language_name_tr_native",
			en: "language_name_en_native",
			ku: "language_name_ku_native"
		};
		return t(keys[language]);
	}
}

const VIEW_SETTINGS_TAG = "view-settings";
if (!customElements.get(VIEW_SETTINGS_TAG)) {
	customElements.define(VIEW_SETTINGS_TAG, ViewSettings);
}

export default ViewSettings;
