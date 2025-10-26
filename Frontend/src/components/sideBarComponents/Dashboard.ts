import "../utils/Header";
import "../utils/SideBar";
import "../utils/Statistics";
import "../utils/LastGames";
import { getUser } from "../../store/UserStore";
import { router } from "../../router/Router";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

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
		return `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<header-component></header-component>
				<div class="pt-16 md:pt-20 lg:pt-24">
					<sidebar-component current-route="dashboard"></sidebar-component>
					<div class="ml-16 p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300" id="mainContent" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
						<div class="mb-6 lg:mb-8 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-4 sm:p-6 lg:p-8 rounded-lg lg:rounded-xl shadow-xl border border-white/20 text-center">
							<h2 id="welcomeMessage" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 lg:mb-3">
								${t("dashboard_welcome_heading", { name })}
							</h2>
							<p class="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg">${t("dashboard_welcome_subtitle")}</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
							<button id="playNowBtn" class="group bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-semibold py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 rounded-lg lg:rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
								<div class="flex items-center justify-center space-x-2 lg:space-x-3">
									<span class="text-xl lg:text-2xl">🎮</span>
									<div class="text-left">
										<div class="text-lg lg:text-xl font-bold">${t("dashboard_quick_play_title")}</div>
										<div class="text-blue-200 text-xs lg:text-sm">${t("dashboard_quick_play_subtitle")}</div>
									</div>
								</div>
							</button>

							<button id="inviteFriendBtn" class="group bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white font-semibold py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 rounded-lg lg:rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
								<div class="flex items-center justify-center space-x-2 lg:space-x-3">
									<span class="text-xl lg:text-2xl">👥</span>
									<div class="text-left">
										<div class="text-lg lg:text-xl font-bold">${t("dashboard_quick_invite_title")}</div>
										<div class="text-green-200 text-xs lg:text-sm">${t("dashboard_quick_invite_subtitle")}</div>
									</div>
								</div>
							</button>
						</div>

						<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-4 sm:p-6 rounded-lg lg:rounded-xl shadow-xl border border-white/20 mb-6 lg:mb-8">
							<statistics-component></statistics-component>
						</div>

						<div class="bg-white/40 backdrop-blur-sm dark:bg-gray-800/20 p-4 sm:p-6 rounded-lg lg:rounded-xl shadow-xl border border-white/20">
							<last-games-component></last-games-component>
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
				<div class="pt-16 md:pt-20 lg:pt-24">
					<div class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))">
						<div class="max-w-6xl mx-auto text-center mb-8 sm:mb-12 lg:mb-16">
							<div class="mb-6 lg:mb-8 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/20 shadow-xl">
								<div class="flex flex-col items-center mb-6 lg:mb-8">
									<div class="flex flex-col sm:flex-row items-center mb-4 lg:mb-6">
										<img class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-0 sm:mr-4 lg:mr-6 drop-shadow-2xl" src="/pong.png" alt="${t("header_logo_alt")}">
										<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white drop-shadow-2xl tracking-wide text-center sm:text-left">
											Ft_Transcendance
										</h1>
									</div>
									<h2 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300 mb-4 lg:mb-6 drop-shadow-lg">
										${t("dashboard_logged_out_heading")}
									</h2>
								</div>
								<p class="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
									${t("dashboard_logged_out_description")}
								</p>
							</div>
						</div>

						<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🎮</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_realtime_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_realtime_description")}</p>
							</div>

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🏆</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_tournaments_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_tournaments_description")}</p>
							</div>

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">👥</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">${t("dashboard_feature_social_title")}</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">${t("dashboard_feature_social_description")}</p>
							</div>
						</div>

						<div class="max-w-4xl mx-auto bg-blue-900/90 backdrop-blur-sm dark:bg-blue-800/90 p-12 rounded-xl text-center shadow-xl border border-blue-400/40 mb-16">
							<h2 class="text-3xl font-bold text-white mb-6 drop-shadow-md">${t("dashboard_cta_title")}</h2>
							<p class="text-blue-100 text-lg mb-8 drop-shadow-sm">${t("dashboard_cta_subtitle")}</p>
							<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
								<button id="ctaSignupBtn" class="bg-white/95 backdrop-blur-sm text-blue-900 font-bold py-4 px-8 rounded-lg hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
									${t("header_signup_button")}
								</button>
								<button id="ctaLoginBtn" class="border-2 border-white/90 bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
									${t("header_login_button")}
								</button>
							</div>
						</div>

						<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
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

							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
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

		if (isCollapsed) {
			mainContent.classList.remove('ml-72');
			mainContent.classList.add('ml-16');
		} else {
			mainContent.classList.remove('ml-16');
			mainContent.classList.add('ml-72');
		}
	}

	private handlePlayNow(): void {
		// TODO: Navigate to game page
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
