import "../utils/Header";
import "../utils/SideBar";
import "./Game/GameStatistics";
import { getUser } from "../../store/UserStore";
import { router } from "../../router/Router";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t } from "../../i18n/lang";
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
		return `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<header-component></header-component>
				<div class="${PAGE_TOP_OFFSET}">
					<div class="py-8 sm:py-12 lg:py-16 min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))">
						<div class="${APP_CONTAINER} text-center space-y-8 sm:space-y-12 lg:space-y-16">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/20 shadow-xl">
								<div class="flex flex-col items-center mb-6 lg:mb-8">
									<div class="flex flex-col sm:flex-row items-center mb-4 lg:mb-6">
										<img class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-0 sm:mr-4 lg:mr-6 drop-shadow-2xl" src="/pong.png" alt="${t("header_logo_alt")}">
										<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white drop-shadow-2xl tracking-wide text-center sm:text-left break-words">
											Ft_Transcendance
										</h1>
									</div>
									<h2 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300 mb-4 lg:mb-6 drop-shadow-lg">
										${t("dashboard_logged_out_heading")}
									</h2>
								</div>
								<p class="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-prose mx-auto drop-shadow-md leading-relaxed">
									${t("dashboard_logged_out_description")}
								</p>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-6 sm:p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🎮</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_realtime_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_realtime_description")}</p>
							</div>

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-6 sm:p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🏆</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_tournaments_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_tournaments_description")}</p>
							</div>

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-6 sm:p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">👥</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_social_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_social_description")}</p>
							</div>
							</div>

							<div class="bg-blue-900/90 backdrop-blur-sm dark:bg-blue-800/90 p-6 sm:p-10 rounded-xl text-center shadow-xl border border-blue-400/40">
								<h2 class="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 drop-shadow-md">${t("dashboard_cta_title")}</h2>
								<p class="text-blue-100 text-base sm:text-lg mb-6 sm:mb-8 drop-shadow-sm max-w-prose mx-auto">${t("dashboard_cta_subtitle")}</p>
								<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
									<button id="ctaSignupBtn" class="w-full sm:w-auto bg-white/95 backdrop-blur-sm text-blue-900 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]">
										${t("header_signup_button")}
									</button>
									<button id="ctaLoginBtn" class="w-full sm:w-auto border-2 border-white/90 bg-white/20 backdrop-blur-sm text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-white hover:text-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]">
										${t("header_login_button")}
									</button>
								</div>
							</div>
						</div>

						<div class="${APP_CONTAINER} grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-6 sm:p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
								<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center drop-shadow-md">
									<span class="text-3xl mr-3">🏓</span>
									${t("dashboard_info_experience_title")}
								</h3>
								<div class="space-y-4">
									${this.renderListItem("⚡", t("dashboard_info_experience_fast"))}
									${this.renderListItem("🎯", t("dashboard_info_experience_controls"))}
									${this.renderListItem("👥", t("dashboard_info_experience_multiplayer"))}
									${this.renderListItem("🏆", t("dashboard_info_experience_tournaments"))}
									${this.renderListItem("📊", t("dashboard_info_experience_stats"))}
								</div>
							</div>

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-6 sm:p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
								<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center drop-shadow-md">
									<span class="text-3xl mr-3">👥</span>
									${t("dashboard_info_social_title")}
								</h3>
								<div class="space-y-4">
									${this.renderListItem("💬", t("dashboard_info_social_chat"))}
									${this.renderListItem("🤝", t("dashboard_info_social_friends"))}
									${this.renderListItem("🎮", t("dashboard_info_social_custom_matches"))}
									${this.renderListItem("🏅", t("dashboard_info_social_achievements"))}
									${this.renderListItem("📈", t("dashboard_info_social_score_tracking"))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderListItem(icon: string, label: string): string {
		return `
			<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
				<span class="mr-3 text-2xl">${icon}</span>
				<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">${label}</span>
			</div>
		`;
	}

	private setupEvents(): void {
		this.querySelector('#playNowBtn')?.addEventListener('click', () => this.handlePlayNow());
		this.querySelector('#inviteFriendBtn')?.addEventListener('click', () => this.handleInviteFriend());
		this.querySelector('#ctaSignupBtn')?.addEventListener('click', () => this.handleCtaSignup());
		this.querySelector('#ctaLoginBtn')?.addEventListener('click', () => this.handleCtaLogin());
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
