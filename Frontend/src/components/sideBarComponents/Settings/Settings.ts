import "../../utils/Header";
import "../../utils/SideBar";
import { getUser } from "../../../store/UserStore";
import { sidebarStateManager } from "../../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../../router/SidebarStateManager";
import messages from "../../utils/Messages";
import { t } from "../../../i18n/lang";
import { APP_CONTAINER, PAGE_TOP_OFFSET } from "../../utils/Layout";

export type SettingsTabKey = "profile" | "security" | "account" | "view";

type UpdateResponse = { success: boolean; message: string; status: number };

type TabAccentStyles = {
	buttonActive: string;
	buttonInactive: string;
	iconActive: string;
	iconInactive: string;
	indicator: string;
};

type SettingsTabConfig = {
	labelKey: string;
	descriptionKey: string;
	icon: string;
	accent: TabAccentStyles;
};

export class Settings extends HTMLElement {
	protected userResponseMappings: Record<number, { titleKey: string; messageKey: string }> = {
		0: { titleKey: "settings_error_connection_title", messageKey: "settings_error_connection_message" },
		400: { titleKey: "settings_error_invalid_data_title", messageKey: "settings_error_invalid_data_message" },
		401: { titleKey: "settings_error_unauthorized_title", messageKey: "settings_error_unauthorized_message" },
		403: { titleKey: "settings_error_forbidden_title", messageKey: "settings_error_forbidden_message" },
		404: { titleKey: "settings_error_not_found_title", messageKey: "settings_error_not_found_message" },
		409: { titleKey: "settings_error_conflict_title", messageKey: "settings_error_conflict_message" },
		429: { titleKey: "settings_error_rate_limit_title", messageKey: "settings_error_rate_limit_message" },
		500: { titleKey: "settings_error_server_title", messageKey: "settings_error_server_message" }
	};

	protected getUserResponseMessage(status: number): { title: string; message: string } {
		const mapping = this.userResponseMappings[status];
		if (!mapping) {
			return {
				title: t("settings_error_generic_title"),
				message: t("settings_error_generic_message")
			};
		}

		return {
			title: t(mapping.titleKey),
			message: t(mapping.messageKey)
		};
	}

	protected handleApiResponse(status: number, containerSelector: string): void {
		const { title, message } = this.getUserResponseMessage(status);
		messages.showMessage(title, message, "error", containerSelector);
		this.scheduleMessageCleanup(containerSelector);
	}

	protected handleUpdateResponse(response: UpdateResponse, containerSelector: string): void {
		if (response.success) {
			messages.showMessage(
				t("common_success"),
				t("settings_generic_update_success"),
				"success",
				containerSelector
			);
		} else {
			this.handleApiResponse(response.status, containerSelector);
		}
	}

	protected scheduleMessageCleanup(containerSelector: string, delay = 7000): void {
		setTimeout(() => {
			messages.clearMessages(containerSelector);
		}, delay);
	}

	protected showValidationErrors(errors: Record<string, string>, containerSelector: string): void {
		const container = this.querySelector(containerSelector);
		if (!container) return;

		messages.clearMessages(containerSelector);

		const errorDiv = document.createElement("div");
		errorDiv.setAttribute("data-message", "true");
		errorDiv.className =
			"mt-6 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 dark:from-red-900/20 dark:via-red-800/30 dark:to-pink-900/20 border-2 border-red-300 dark:border-red-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm";

		const headerDiv = document.createElement("div");
		headerDiv.className = "flex items-center mb-4";

		const iconDiv = document.createElement("div");
		iconDiv.className = "w-10 h-10 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-3 shadow-md";
		iconDiv.innerHTML = `
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
			</svg>
		`;

		const titleDiv = document.createElement("div");
		titleDiv.innerHTML = `
			<h3 class="text-red-800 dark:text-red-200 font-bold text-lg">${t("validation_form_missing_title")}</h3>
			<p class="text-red-600 dark:text-red-300 text-sm">${t("validation_form_missing_subtitle")}</p>
		`;

		headerDiv.appendChild(iconDiv);
		headerDiv.appendChild(titleDiv);
		errorDiv.appendChild(headerDiv);

		const errorsList = document.createElement("div");
		errorsList.className = "space-y-3 mt-4";

		Object.values(errors).forEach((error, index) => {
			const errorItem = document.createElement("div");
			errorItem.className =
				"flex items-start p-4 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-red-200 dark:border-red-600/30 hover:bg-white/90 dark:hover:bg-gray-700/50 transition-colors duration-200 shadow-sm";

			errorItem.innerHTML = `
				<div class="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
					<span class="text-red-600 dark:text-red-400 text-xs font-bold">${index + 1}</span>
				</div>
				<div class="flex-1">
					<p class="text-red-800 dark:text-red-200 text-sm font-medium leading-relaxed">${error}</p>
				</div>
			`;

			errorsList.appendChild(errorItem);
		});

		const footerDiv = document.createElement("div");
		footerDiv.className = "mt-4 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-600/30";
		footerDiv.innerHTML = `
			<p class="text-red-700 dark:text-red-300 text-xs flex items-center">
				<svg class="w-4 h-4 mr-2 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				${t("validation_form_missing_footer")}
			</p>
		`;

		errorDiv.appendChild(errorsList);
		errorDiv.appendChild(footerDiv);
		container.appendChild(errorDiv);

		setTimeout(() => {
			errorDiv.remove();
		}, 8000);
	}

	protected showSuccessMessage(title: string, message: string, containerSelector: string): void {
		const container = this.querySelector(containerSelector);
		if (!container) return;

		messages.clearMessages(containerSelector);

		const successDiv = document.createElement("div");
		successDiv.setAttribute("data-message", "true");
		successDiv.className =
			"mt-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-2 border-green-300 dark:border-green-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300";
		successDiv.innerHTML = `
			<div class="flex items-center">
				<div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-green-800 dark:text-green-200 font-bold text-lg mb-1">${title}</h3>
					<p class="text-green-700 dark:text-green-300 text-sm leading-relaxed">${message}</p>
				</div>
				<div class="ml-4">
					<div class="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
						<span class="text-green-600 dark:text-green-400 text-lg">✓</span>
					</div>
				</div>
			</div>
		`;

		container.appendChild(successDiv);

		setTimeout(() => {
			successDiv.remove();
		}, 6000);
	}

	protected showErrorMessage(title: string, message: string, containerSelector: string): void {
		const container = this.querySelector(containerSelector);
		if (!container) return;

		messages.clearMessages(containerSelector);

		const errorDiv = document.createElement("div");
		errorDiv.setAttribute("data-message", "true");
		errorDiv.className =
			"mt-4 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 dark:from-red-900/30 dark:via-red-800/30 dark:to-pink-900/30 border-2 border-red-300 dark:border-red-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300";
		errorDiv.innerHTML = `
			<div class="flex items-center">
				<div class="w-12 h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-red-800 dark:text-red-200 font-bold text-lg mb-1">${title}</h3>
					<p class="text-red-700 dark:text-red-300 text-sm leading-relaxed">${message}</p>
				</div>
				<div class="ml-4">
					<div class="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center">
						<span class="text-red-600 dark:text-red-400 text-lg">!</span>
					</div>
				</div>
			</div>
		`;

		container.appendChild(errorDiv);

		setTimeout(() => {
			errorDiv.remove();
		}, 7000);
	}
}

class SettingsContainer extends Settings {
	private currentTab: SettingsTabKey = "profile";
	private sidebarListener: SidebarStateListener | null = null;
	private languageChangeHandler: ((event: Event) => void) | null = null;
	private readonly tabConfig: Record<SettingsTabKey, SettingsTabConfig> = {
		profile: {
			labelKey: "settings_tabs_profile_label",
			descriptionKey: "settings_tabs_profile_description",
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9A3.75 3.75 0 1112 5.25 3.75 3.75 0 0115.75 9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 20.25a7.5 7.5 0 0115 0"></path></svg>`,
			accent: {
				buttonActive: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-900/30 dark:text-blue-200",
				buttonInactive:
					"border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-blue-400/40 dark:hover:bg-blue-900/20",
				iconActive: "bg-blue-100 text-blue-600 dark:bg-blue-800/60 dark:text-blue-100",
				iconInactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
				indicator: "bg-blue-400/70"
			}
		},
		account: {
			labelKey: "settings_tabs_account_label",
			descriptionKey: "settings_tabs_account_description",
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7h16M6 11h.01M10 11h8M6 15h.01M10 15h8M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z"></path></svg>`,
			accent: {
				buttonActive: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-900/30 dark:text-emerald-200",
				buttonInactive:
					"border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-900/20",
				iconActive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-800/60 dark:text-emerald-100",
				iconInactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
				indicator: "bg-emerald-400/70"
			}
		},
		security: {
			labelKey: "settings_tabs_security_label",
			descriptionKey: "settings_tabs_security_description",
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5l7 4v5a7 7 0 01-7 7 7 7 0 01-7-7V9l7-4z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4"></path></svg>`,
			accent: {
				buttonActive: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-900/30 dark:text-rose-200",
				buttonInactive:
					"border-gray-200 bg-white text-gray-700 hover:border-rose-200 hover:bg-rose-50/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-rose-400/40 dark:hover:bg-rose-900/20",
				iconActive: "bg-rose-100 text-rose-600 dark:bg-rose-800/60 dark:text-rose-100",
				iconInactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
				indicator: "bg-rose-400/70"
			}
		},
		view: {
			labelKey: "settings_tabs_view_label",
			descriptionKey: "settings_tabs_view_description",
			icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v18m-6-6h12M6 9h12"></path></svg>`,
			accent: {
				buttonActive: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/40 dark:bg-purple-900/30 dark:text-purple-200",
				buttonInactive:
					"border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-purple-400/40 dark:hover:bg-purple-900/20",
				iconActive: "bg-purple-100 text-purple-600 dark:bg-purple-800/60 dark:text-purple-100",
				iconInactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
				indicator: "bg-purple-400/70"
			}
		}
	};
	private readonly tabComponentMap: Record<SettingsTabKey, string> = {
		profile: "profile-settings",
		security: "security-settings",
		account: "account-settings",
		view: "view-settings"
	};

	connectedCallback(): void {
		this.renderRoot();
		this.setupSidebarListener();
		this.languageChangeHandler = () => this.renderRoot();
		document.addEventListener("languagechange", this.languageChangeHandler as EventListener);
	}

	disconnectedCallback(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		if (this.languageChangeHandler) {
			document.removeEventListener("languagechange", this.languageChangeHandler as EventListener);
			this.languageChangeHandler = null;
		}
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => this.updateMainContentMargin(state.isCollapsed);
		sidebarStateManager.addListener(this.sidebarListener);
		
		// Initial state için margin'i ayarla
		this.updateMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private updateMainContentMargin(isCollapsed: boolean): void {
		const layout = this.querySelector(".settings-shell");
		if (!layout) return;

		layout.classList.add("ml-0");
		layout.classList.toggle("md:ml-16", isCollapsed);
		layout.classList.toggle("md:ml-72", !isCollapsed);
	}

	private renderRoot(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
						<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${t("settings_login_required_title")}</h2>
						<p class="text-gray-600 dark:text-gray-400">${t("settings_login_required_description")}</p>
					</div>
				</div>
			`;
			return;
		}

		const marginClass = sidebarStateManager.getMarginClass();

		this.innerHTML = `
			<div class="settings-page min-h-screen bg-gray-50 dark:bg-gray-900 bg-[url('/DashboardBackground.jpg')] bg-cover bg-center bg-fixed">
				<header-component></header-component>
				<sidebar-component current-route="settings"></sidebar-component>

				<div class="settings-shell ${marginClass} ${PAGE_TOP_OFFSET} transition-all duration-300 min-w-0">
					<div class="${APP_CONTAINER} pb-8 sm:pb-12 lg:pb-16">
						<section class="mb-4 sm:mb-6">
							<div class="rounded-xl sm:rounded-2xl border border-white/50 bg-white/85 backdrop-blur-sm shadow-lg shadow-black/5 dark:border-white/10 dark:bg-gray-900/70">
								<div class="flex flex-col gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 lg:p-8">
									<div class="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
										<div class="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/30 text-blue-600 dark:text-blue-200">
											<svg class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.573-1.066z"></path>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
											</svg>
										</div>
										<div class="text-center">
											<h1 class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">${t("settings_title")}</h1>
											<p class="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
												${t("settings_subtitle")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</section>

						<section class="settings-container flex flex-col xl:flex-row gap-3 sm:gap-4 md:gap-6 xl:gap-8 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/10 border border-white/30 overflow-hidden min-h-[50vh] sm:min-h-[60vh]">
							<aside class="settings-sidebar bg-gray-50/85 dark:bg-gray-900/70 border-b xl:border-b-0 xl:border-r border-gray-200/50 dark:border-gray-700/50 p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 xl:w-64 xl:max-w-sm flex flex-col gap-2 sm:gap-3 md:gap-4">
								<div class="hidden xl:block">
									<div class="px-2 py-2 sm:py-3 mb-1 sm:mb-2">
										<h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">${t("settings_sidebar_card_title")}</h3>
									</div>
								</div>
								<nav class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:flex md:flex-row md:gap-3 xl:flex-col xl:gap-3 md:overflow-x-auto md:pb-2 pr-1 xl:overflow-visible xl:pb-0 -mx-1 px-1">
									${this.renderSidebarButtons()}
								</nav>
							</aside>

							<main class="settings-content flex-1 min-w-0 p-2 sm:p-3 md:p-4 xl:p-6 overflow-auto">
								<div class="settings-panel h-full min-h-[40vh] sm:min-h-[50vh] rounded-xl sm:rounded-2xl border border-white/60 bg-white/85 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-gray-900/70 backdrop-blur-md overflow-hidden">
									<div class="settings-dynamic space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8"></div>
								</div>
							</main>
						</section>
					</div>
				</div>
			</div>
		`;

		this.attachTabEvents();
		void this.renderActiveSection();
	}

	private attachTabEvents(): void {
		this.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
			button.addEventListener("click", () => {
				const tab = button.getAttribute("data-tab") as SettingsTabKey | null;
				if (!tab || tab === this.currentTab) return;
				this.switchTab(tab);
			});
		});
	}

	private switchTab(tab: SettingsTabKey): void {
		this.currentTab = tab;
		this.updateTabItemStyles();
		void this.renderActiveSection();
	}

	private async renderActiveSection(): Promise<void> {
		const user = getUser();
		const container = this.querySelector(".settings-dynamic");

		if (!container) return;

		container.innerHTML = "";

		if (!user) {
			container.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">${t("settings_login_required_title")}</h2>
					<p class="text-gray-600 dark:text-gray-400">${t("settings_login_required_description")}</p>
				</div>
			`;
			this.updateTabItemStyles();
			return;
		}

		await this.ensureComponentLoaded(this.currentTab);

		const tagName = this.tabComponentMap[this.currentTab];
		if (!tagName) {
			this.updateTabItemStyles();
			return;
		}

		const element = document.createElement(tagName);
		container.appendChild(element);
		this.updateTabItemStyles();
	}

	private renderSidebarButtons(): string {
		return (Object.entries(this.tabConfig) as [SettingsTabKey, SettingsTabConfig][])
			.map(([key, config]) => {
				const isActive = this.currentTab === key;
				return `
					<button type="button" data-tab="${key}" class="${this.getTabItemClasses(key)}">
						<span class="${this.getIndicatorClass(key, isActive)}"></span>
						<span class="${this.getIconClass(key, isActive)}">
							${config.icon}
						</span>
						<span class="flex flex-col items-start">
							<span class="${this.getLabelClass(isActive)}">${t(config.labelKey)}</span>
							<span class="${this.getDescriptionClass(isActive)}">${t(config.descriptionKey)}</span>
						</span>
					</button>
				`;
			})
			.join("");
	}

	private getIconClass(tab: SettingsTabKey, isActive: boolean): string {
		const accent = this.tabConfig[tab].accent;
		const base = "tab-icon flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 shadow-sm";
		return `${base} ${isActive ? accent.iconActive : accent.iconInactive}`;
	}

	private getLabelClass(isActive: boolean): string {
		const base = "tab-label text-xs sm:text-sm font-semibold break-words leading-tight";
		return `${base} ${isActive ? "text-inherit" : "text-gray-700 dark:text-gray-200"}`;
	}

	private getDescriptionClass(isActive: boolean): string {
		const base = "tab-description text-[10px] sm:text-xs hidden xl:block break-words leading-tight";
		return `${base} ${isActive ? "text-inherit opacity-80" : "text-gray-500 dark:text-gray-400"}`;
	}

	private getIndicatorClass(tab: SettingsTabKey, isActive: boolean): string {
		const accent = this.tabConfig[tab].accent;
		const base =
			"tab-indicator pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full transition-opacity duration-200 hidden xl:block";
		return `${base} ${accent.indicator} ${isActive ? "opacity-100" : "opacity-0"}`;
	}

	private async ensureComponentLoaded(tab: SettingsTabKey): Promise<void> {
		switch (tab) {
			case "profile":
				await import("./ProfileSettings");
				break;
			case "security":
				await import("./SecuritySettings");
				break;
			case "account":
				await import("./AccountSettings");
				break;
			case "view":
				await import("./ViewSettings");
				break;
			default:
				break;
		}
	}

	private updateTabItemStyles(): void {
		this.querySelectorAll("[data-tab]").forEach((el) => {
			const tab = el.getAttribute("data-tab") as SettingsTabKey | null;
			if (!tab) return;
			const config = this.tabConfig[tab];
			const element = el as HTMLElement;
			const isActive = this.currentTab === tab;

			element.className = this.getTabItemClasses(tab);

			const icon = element.querySelector(".tab-icon") as HTMLElement | null;
			if (icon) {
				const base = "tab-icon flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 shadow-sm";
				icon.className = `${base} ${isActive ? config.accent.iconActive : config.accent.iconInactive}`;
			}

			const label = element.querySelector(".tab-label") as HTMLElement | null;
			if (label) {
				const base = "tab-label text-xs sm:text-sm font-semibold transition-colors duration-200 break-words leading-tight";
				label.className = `${base} ${isActive ? "text-white" : "text-gray-800 dark:text-gray-100"}`;
			}

			const description = element.querySelector(".tab-description") as HTMLElement | null;
			if (description) {
				const base = "tab-description text-[10px] sm:text-xs transition-colors duration-200 hidden xl:block break-words leading-tight";
				description.className = `${base} ${isActive ? "text-white/85" : "text-gray-500 dark:text-gray-400"}`;
			}

			const indicator = element.querySelector(".tab-indicator") as HTMLElement | null;
			if (indicator) {
				const base =
					"tab-indicator pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full transition-all duration-300 origin-center hidden xl:block";
				indicator.className = `${base} ${config.accent.indicator} ${
					isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
				}`;
			}
		});
	}

	private getTabItemClasses(tab: SettingsTabKey): string {
		const base =
			"settings-tab-item relative flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-shrink-0 md:min-w-[180px] xl:min-w-0 xl:w-full px-2 sm:px-3 md:px-3.5 py-2 sm:py-2.5 md:py-3 xl:px-4 xl:py-3 rounded-lg sm:rounded-xl border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 min-h-[44px]";

		const accent = this.tabConfig[tab].accent;

		if (this.currentTab === tab) {
			return `${base} ${accent.buttonActive}`;
		}

		return `${base} ${accent.buttonInactive}`;
	}
}

const SETTINGS_COMPONENT_TAG = "settings-component";
if (!customElements.get(SETTINGS_COMPONENT_TAG)) {
	customElements.define(SETTINGS_COMPONENT_TAG, SettingsContainer);
}

export default SettingsContainer;
