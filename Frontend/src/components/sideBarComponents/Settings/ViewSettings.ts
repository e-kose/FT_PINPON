import { Settings } from "./Settings";
import { getUser } from "../../../store/UserStore";

const MESSAGE_CONTAINER = ".view-message-container";

class ViewSettings extends Settings {
	connectedCallback(): void {
		this.renderSection();
	}

	private renderSection(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Görünüm ayarları yüklenemedi</h2>
					<p class="text-gray-600 dark:text-gray-400">Lütfen tekrar giriş yapmayı deneyin.</p>
				</div>
			`;
			return;
		}

		this.innerHTML = `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">View Settings</h2>
				</div>

				<div class="space-y-6">
					<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tema</h3>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<button data-theme="light" class="theme-option p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex flex-col items-center space-y-2">
								<div class="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Açık</span>
							</button>
							<button data-theme="dark" class="theme-option p-4 rounded-lg border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 flex flex-col items-center space-y-2 bg-blue-50 dark:bg-blue-900/20">
								<div class="w-12 h-12 bg-gray-800 rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
										<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Koyu</span>
							</button>
							<button data-theme="auto" class="theme-option p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex flex-col items-center space-y-2">
								<div class="w-12 h-12 bg-gradient-to-br from-white to-gray-800 rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Otomatik</span>
							</button>
						</div>
					</div>

					<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dil</h3>
						<div class="grid grid-cols-2 gap-4">
							<button data-language="tr" class="language-option p-4 rounded-lg border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20">
								<div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
									<span class="text-white text-sm font-bold">TR</span>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Türkçe</span>
							</button>
							<button data-language="en" class="language-option p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex items-center space-x-3">
								<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
									<span class="text-white text-sm font-bold">EN</span>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">English</span>
							</button>
						</div>
					</div>
				</div>

				<div class="view-message-container mt-6"></div>
			</div>
		`;

		this.bindEvents();
	}

	private bindEvents(): void {
		this.querySelectorAll<HTMLButtonElement>(".theme-option").forEach((button) => {
			button.addEventListener("click", () => {
				const theme = button.getAttribute("data-theme");
				if (theme) this.changeTheme(theme);
			});
		});

		this.querySelectorAll<HTMLButtonElement>(".language-option").forEach((button) => {
			button.addEventListener("click", () => {
				const language = button.getAttribute("data-language");
				if (language) this.changeLanguage(language);
			});
		});
	}

	private changeTheme(theme: string): void {
		console.log("Changing theme to:", theme);
		this.showSuccessMessage("Tema Güncellendi", `Tema tercihiniz "${theme}" olarak güncellendi.`, MESSAGE_CONTAINER);
	}

	private changeLanguage(language: string): void {
		console.log("Changing language to:", language);
		this.showSuccessMessage(
			"Dil Güncellendi",
			`Dil tercihiniz "${language.toUpperCase()}" olarak güncellendi.`,
			MESSAGE_CONTAINER
		);
	}
}

const VIEW_SETTINGS_TAG = "view-settings";
if (!customElements.get(VIEW_SETTINGS_TAG)) {
	customElements.define(VIEW_SETTINGS_TAG, ViewSettings);
}

export default ViewSettings;
