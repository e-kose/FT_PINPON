import "../utils/Header";
import "../utils/SideBar";
import "./Game/GameStatistics";
import { getUser } from "../../store/UserStore";
import { router } from "../../router/Router";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t, getLanguage, setLanguage, type SupportedLanguage } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "../utils/Layout";

class Dashboard extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;

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

	protected renderComponent(): void {
		const user = getUser();
		this.innerHTML = user ? this.renderLoggedIn(user) : this.renderLoggedOut();
	}

	protected afterRender(): void {
		this.setupEvents();
		this.adjustMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private renderLoggedIn(user: NonNullable<ReturnType<typeof getUser>>): string {
		const name = user.profile?.full_name?.trim() || user.username || t("dashboard_player_fallback_name");
		const marginClass = sidebarStateManager.getMarginClass();
		return `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<header-component></header-component>
				<div class="${PAGE_TOP_OFFSET}">
					<sidebar-component current-route="dashboard"></sidebar-component>
					<div class="${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0" id="mainContent" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
						<div class="${APP_CONTAINER} space-y-6 sm:space-y-8">
							<div class="relative overflow-hidden rounded-2xl lg:rounded-3xl border border-blue-200/60 dark:border-blue-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-2xl p-6 sm:p-8 lg:p-10">
								<div class="absolute inset-0 pointer-events-none">
									<div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10"></div>
									<div class="absolute top-6 right-6 w-16 h-16 rounded-full border border-blue-500/20"></div>
									<div class="absolute bottom-6 left-6 w-20 h-20 rounded-full border border-indigo-500/15"></div>
									<div class="absolute top-1/2 left-1/2 w-24 h-1 bg-blue-500/20 -translate-x-1/2 -translate-y-1/2"></div>
								</div>
								<div class="relative z-10 grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-6 lg:gap-10 items-center">
									<div class="min-w-0">
										<h2 id="welcomeMessage" class="text-2xl sm:text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight break-words">
											${t("dashboard_welcome_heading", { name })}
										</h2>
										<p class="mt-3 text-sm sm:text-base lg:text-xl text-slate-600 dark:text-slate-300 max-w-prose">
											${t("dashboard_welcome_subtitle")}
										</p>
									</div>
									<div class="flex flex-col items-start lg:items-end gap-4">
										<button id="playNowBtn" class="group inline-flex items-center justify-center gap-3 px-7 sm:px-9 lg:px-10 py-3.5 sm:py-4 rounded-2xl min-h-[54px] text-base sm:text-lg lg:text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 hover:-translate-y-0.5">
											<span class="text-lg">▶</span>
											<span>${t("dashboard_welcome_cta")}</span>
										</button>
									</div>
								</div>
							</div>

							<game-statistics mode="summary"></game-statistics>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderLoggedOut(): string {
		const currentLanguage = getLanguage();
		const languageOptions: Array<{
			code: SupportedLanguage;
			labelKey: string;
			secondaryKey: string;
			accentClass: string;
		}> = [
			{ code: "tr", labelKey: "language_name_tr_native", secondaryKey: "language_name_tr_secondary", accentClass: "from-blue-500/15 to-cyan-500/10 text-blue-700 dark:text-blue-200 border-blue-500/30" },
			{ code: "en", labelKey: "language_name_en_native", secondaryKey: "language_name_en_secondary", accentClass: "from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-500/30" },
			{ code: "ku", labelKey: "language_name_ku_native", secondaryKey: "language_name_ku_secondary", accentClass: "from-violet-500/15 to-fuchsia-500/10 text-violet-700 dark:text-violet-200 border-violet-500/30" }
		];
		const languageButtons = languageOptions
			.map((option) => {
				const isActive = option.code === currentLanguage;
				const baseClasses = "dashboard-language-option flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 transition-all duration-200 min-h-[56px]";
				const activeClasses = `bg-gradient-to-br ${option.accentClass} shadow-md`;
				const inactiveClasses = "bg-white/80 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:border-slate-300/70 dark:hover:border-slate-600/70";
				return `
					<button data-language="${option.code}" class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}">
						<span class="text-sm font-semibold">${t(option.labelKey)}</span>
						<span class="text-[11px] opacity-80">${t(option.secondaryKey)}</span>
						${isActive ? `<span class="text-[10px] font-semibold uppercase tracking-wide">${t("view_settings_preferred_language")}</span>` : ""}
					</button>
				`;
			})
			.join("");

		return `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<header-component></header-component>
				<div class="${PAGE_TOP_OFFSET}">
					<div class="py-8 sm:py-12 lg:py-16 min-h-screen" style="background: linear-gradient(rgba(2, 6, 23, 0.65), rgba(2, 6, 23, 0.75))">
						<div class="${APP_CONTAINER} space-y-10 sm:space-y-12 lg:space-y-14">
							<section class="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
								<div class="relative h-full overflow-hidden rounded-2xl lg:rounded-3xl bg-white/85 dark:bg-slate-900/85 border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-8">
									<div class="absolute inset-0 pointer-events-none">
										<div class="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-500/10"></div>
										<div class="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"></div>
										<div class="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
									</div>
									<div class="relative z-10 space-y-6">
										<div class="flex flex-col sm:flex-row sm:items-center gap-4">
											<div class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-700/70 shadow-xl flex items-center justify-center flex-shrink-0">
												<img class="w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-xl" src="/pong.png" alt="${t("header_logo_alt")}">
											</div>
											<div class="space-y-2">
												<p class="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">${t("dashboard_logged_out_kicker")}</p>
												<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-[1.15]">
													${t("dashboard_logged_out_heading")}
												</h1>
											</div>
										</div>
										<p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
											${t("dashboard_logged_out_description")}
										</p>
									</div>
									<div class="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
										<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 text-sm font-semibold text-slate-700 dark:text-slate-200">
											<span>🎮</span>
											<span>${t("sidebar_nav_play")}</span>
										</div>
										<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 text-sm font-semibold text-slate-700 dark:text-slate-200">
											<span>👥</span>
											<span>${t("sidebar_nav_friends")}</span>
										</div>
										<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 text-sm font-semibold text-slate-700 dark:text-slate-200">
											<span>💬</span>
											<span>${t("sidebar_nav_chat")}</span>
										</div>
										<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 text-sm font-semibold text-slate-700 dark:text-slate-200">
											<span>⚙️</span>
											<span>${t("sidebar_nav_settings")}</span>
										</div>
									</div>
								</div>

								<div class="relative h-full overflow-hidden rounded-2xl lg:rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-white/40 dark:border-slate-700/60 shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-8">
									<div class="absolute inset-0 pointer-events-none">
										<div class="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-blue-500/10 dark:from-slate-900/20"></div>
										<div class="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl"></div>
										<div class="absolute -bottom-16 right-6 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"></div>
									</div>
									<div class="relative z-10 space-y-4">
										<h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">${t("dashboard_cta_title")}</h2>
										<p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">${t("dashboard_cta_subtitle")}</p>
									</div>
									<div class="relative z-10 space-y-6">
										<div class="flex flex-col sm:flex-row gap-4">
											<button id="ctaSignupBtn" class="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]">
												${t("header_signup_button")}
											</button>
											<button id="ctaLoginBtn" class="w-full sm:w-auto border-2 border-blue-500/40 bg-white/70 dark:bg-slate-800/60 text-blue-900 dark:text-blue-100 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]">
												${t("header_login_button")}
											</button>
										</div>
										<div class="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 p-4">
											<div class="space-y-2 mb-3">
												<h3 class="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">${t("view_settings_language_selection_title")}</h3>
												<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300">${t("view_settings_language_description")}</p>
											</div>
											<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
												${languageButtons}
											</div>
										</div>
									</div>
								</div>
							</section>

							<section class="space-y-6">
								<div class="text-center max-w-2xl mx-auto space-y-3">
									<h2 class="text-2xl sm:text-3xl font-bold text-white">${t("dashboard_pillars_heading")}</h2>
									<p class="text-sm sm:text-base text-slate-200">${t("dashboard_pillars_subheading")}</p>
								</div>
								<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
									<div class="relative overflow-hidden bg-white/90 dark:bg-slate-900/85 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-xl h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
										<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
										<div class="flex items-start gap-4 mb-5">
											<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-500/30 shadow-sm">🏓</div>
											<div>
												<h3 class="text-xl font-bold text-slate-900 dark:text-white">${t("dashboard_pillar_play_title")}</h3>
												<p class="text-sm text-slate-600 dark:text-slate-300">${t("dashboard_pillar_play_subtitle")}</p>
											</div>
										</div>
										<div class="space-y-2">
											${this.renderListItem("🎮", t("dashboard_pillar_play_local"))}
											${this.renderListItem("⚔️", t("dashboard_pillar_play_matchmaking"))}
											${this.renderListItem("🏆", t("dashboard_pillar_play_tournaments"))}
											${this.renderListItem("🧭", t("dashboard_pillar_play_arena"))}
										</div>
									</div>

									<div class="relative overflow-hidden bg-white/90 dark:bg-slate-900/85 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-xl h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
										<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
										<div class="flex items-start gap-4 mb-5">
											<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/30 shadow-sm">💬</div>
											<div>
												<h3 class="text-xl font-bold text-slate-900 dark:text-white">${t("dashboard_pillar_social_title")}</h3>
												<p class="text-sm text-slate-600 dark:text-slate-300">${t("dashboard_pillar_social_subtitle")}</p>
											</div>
										</div>
										<div class="space-y-2">
											${this.renderListItem("🟢", t("dashboard_pillar_social_friends"))}
											${this.renderListItem("💬", t("dashboard_pillar_social_chat"))}
											${this.renderListItem("📨", t("dashboard_pillar_social_requests"))}
											${this.renderListItem("🛡️", t("dashboard_pillar_social_controls"))}
										</div>
									</div>

									<div class="relative overflow-hidden bg-white/90 dark:bg-slate-900/85 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-xl h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
										<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500"></div>
										<div class="flex items-start gap-4 mb-5">
											<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-700 dark:text-violet-300 flex items-center justify-center border border-violet-500/30 shadow-sm">👤</div>
											<div>
												<h3 class="text-xl font-bold text-slate-900 dark:text-white">${t("dashboard_pillar_profile_title")}</h3>
												<p class="text-sm text-slate-600 dark:text-slate-300">${t("dashboard_pillar_profile_subtitle")}</p>
											</div>
										</div>
										<div class="space-y-2">
											${this.renderListItem("🧩", t("dashboard_pillar_profile_customization"))}
											${this.renderListItem("🔐", t("dashboard_pillar_profile_security"))}
											${this.renderListItem("⚙️", t("dashboard_pillar_profile_settings"))}
											${this.renderListItem("📊", t("dashboard_pillar_profile_stats"))}
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderListItem(icon: string, label: string): string {
		return `
			<div class="flex items-start gap-3 p-3 rounded-xl border border-slate-100/80 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all">
				<span class="text-lg">${icon}</span>
				<span class="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">${label}</span>
			</div>
		`;
	}

	private setupEvents(): void {
		this.querySelector('#playNowBtn')?.addEventListener('click', () => this.handlePlayNow());
		this.querySelector('#inviteFriendBtn')?.addEventListener('click', () => this.handleInviteFriend());
		this.querySelector('#ctaSignupBtn')?.addEventListener('click', () => this.handleCtaSignup());
		this.querySelector('#ctaLoginBtn')?.addEventListener('click', () => this.handleCtaLogin());
		this.querySelectorAll<HTMLButtonElement>('.dashboard-language-option').forEach((button) => {
			button.addEventListener('click', () => {
				const language = button.getAttribute('data-language');
				if (language) {
					setLanguage(language as SupportedLanguage);
				}
			});
		});
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.adjustMainContentMargin(state.isCollapsed);
		};

		sidebarStateManager.addListener(this.sidebarListener);
	}

	private adjustMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector('#mainContent');
		if (!mainContent) return;

		const transitionClasses = sidebarStateManager.getTransitionClasses();
		mainContent.classList.add(...transitionClasses);
		mainContent.classList.add("ml-0");

		if (isCollapsed) {
			mainContent.classList.remove('md:ml-72');
			mainContent.classList.add('md:ml-16');
		} else {
			mainContent.classList.remove('md:ml-16');
			mainContent.classList.add('md:ml-72');
		}
	}

	private handlePlayNow(): void {
		router.navigate('/play');
	}

	private handleInviteFriend(): void {
		// TODO: Open friend invitation modal
	}

	private handleCtaSignup(): void {
		router.navigate('/signup');
	}

	private handleCtaLogin(): void {
		router.navigate('/login');
	}
}

customElements.define("dashboard-component", Dashboard);
export default Dashboard;
