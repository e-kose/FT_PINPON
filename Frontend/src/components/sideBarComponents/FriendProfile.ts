import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { router } from "../../router/Router";
import { t, getLanguage } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "../utils/Layout";
import FriendService from "../../services/FriendService";
import type { FriendProfile as FriendProfileType } from "../../types/FriendsType";

class FriendProfile extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private loading = true;
	private friendData: FriendProfileType | null = null;
	private error: string | null = null;
	private friendId: number | null = null;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		this.extractFriendIdAndFetch();
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
	}

	private extractFriendIdAndFetch(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('id');
		
		if (!id) {
			this.error = t("friend_profile_error_no_id");
			this.loading = false;
			this.renderAndBind();
			return;
		}

		this.friendId = parseInt(id, 10);
		if (isNaN(this.friendId)) {
			this.error = t("friend_profile_invalid_id");
			this.loading = false;
			this.renderAndBind();
			return;
		}

		void this.fetchFriendProfile();
	}

	private async fetchFriendProfile(): Promise<void> {
		if (!this.friendId) return;
		console.log("====================== Fetching profile for friend ID:", this.friendId);
		this.loading = true;
		this.error = null;
		this.renderAndBind();

		try {
			const response = await FriendService.getFriendProfile(this.friendId);
			console.log("------------------------------------------------------------------------------Friend profile response:", response);
			if (response.status === 404) {
				this.error = t("friend_profile_error_not_found");
			} else if (response.status === 500) {
				this.error = t("friend_profile_error_server");
			} else if (!response.ok || !response.data.success) {
				this.error = response.data.message || t("friend_profile_error_general");
			} else {
				console.log("------------------------------------------------------------------------------Friend profile data:", response.data);
				this.friendData = response.data.user || response.data;
			}
		} catch (err) {
			console.error("Error fetching friend profile:", err);
			this.error = t("friend_profile_error_network");
		} finally {
			this.loading = false;
			this.renderAndBind();
		}
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.updateMainContentMargin(state.isCollapsed);
		};
		sidebarStateManager.addListener(this.sidebarListener);
		this.updateMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private updateMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector('.main-content');
		if (mainContent) {
			mainContent.classList.add('ml-0');
			mainContent.classList.toggle('md:ml-16', isCollapsed);
			mainContent.classList.toggle('md:ml-72', !isCollapsed);
		}
	}

	private formatDate(dateString: string): string {
		const date = new Date(dateString);
		const locale = getLanguage() === "tr" ? "tr-TR" : "en-US";
		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	protected renderComponent(): void {
		const marginClass = sidebarStateManager.getMarginClass();

		// Loading state
		if (this.loading) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
					<header-component></header-component>
					<div class="${PAGE_TOP_OFFSET}">
						<sidebar-component current-route="friends"></sidebar-component>
						<div class="main-content ${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
							<div class="${APP_CONTAINER}">
								<div class="flex flex-col items-center justify-center py-20">
									<div class="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
									<p class="text-gray-400 dark:text-gray-300 text-lg">${t("friend_profile_loading")}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
			return;
		}

		// Error state
		if (this.error || !this.friendData) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
					<header-component></header-component>
					<div class="${PAGE_TOP_OFFSET}">
						<sidebar-component current-route="friends"></sidebar-component>
						<div class="main-content ${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
							<div class="${APP_CONTAINER}">
								<div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 p-8 text-center">
									<div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
										<svg class="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
									</div>
									<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${t("friend_profile_error_title")}</h2>
									<p class="text-gray-600 dark:text-gray-400 mb-6">${this.error || t("friend_profile_fetch_error")}</p>
									<button class="back-to-friends-btn bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 min-h-[44px]">
										${t("friend_profile_back_button")}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
			return;
		}

		// Success state with friend data
		const friend = this.friendData;
		const fullName = friend.profile?.full_name?.trim() || t("friend_profile_value_missing");
		const displayName = friend.profile?.full_name?.trim() || friend.username;
		const bio = friend.profile?.bio?.trim() || t("friend_profile_bio_empty");
		const bioClass = friend.profile?.bio ? "" : "text-gray-500 italic";

		this.innerHTML = `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<header-component></header-component>
				
				<div class="${PAGE_TOP_OFFSET}">
					<sidebar-component current-route="friends"></sidebar-component>

					<div class="main-content ${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
						<div class="${APP_CONTAINER} max-w-none">
							<div class="w-full max-w-6xl mx-auto space-y-6">
								<div class="bg-white/90 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl shadow-lg border border-slate-200/70 dark:border-slate-700/60 overflow-hidden">
									<div class="relative p-6 sm:p-8">
										<div class="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/80 to-slate-100/80 dark:from-slate-900/70 dark:via-slate-800/70 dark:to-slate-900/70"></div>
										<div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
											<div class="flex items-center gap-5">
												<img 
													src="${friend.profile?.avatar_url || '/default-avatar.png'}" 
													alt="${t("friend_profile_avatar_alt")}" 
													class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-1 ring-slate-200/80 dark:ring-slate-700/80 shadow-md"
												>
												<div>
													<h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">${displayName}</h1>
													<p class="text-slate-500 dark:text-slate-300">@${friend.username}</p>
												</div>
											</div>
											<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
												<button class="back-to-friends-btn w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium py-3 px-6 rounded-xl transition-colors duration-200 min-h-[44px]">
													<span class="flex items-center justify-center space-x-2">
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
														</svg>
														<span>${t("friend_profile_back_button")}</span>
													</span>
												</button>
												<button class="message-friend-btn w-full sm:w-auto border border-slate-200/80 dark:border-slate-600/70 text-slate-800 dark:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 font-medium py-3 px-6 rounded-xl transition-colors duration-200 min-h-[44px]">
													<span class="flex items-center justify-center space-x-2">
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h8m-8 4h5m-9 4h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
														</svg>
														<span>${t("friend_profile_message_button")}</span>
													</span>
												</button>
											</div>
										</div>
									</div>
								</div>

								<div class="grid grid-cols-1 lg:grid-cols-6 gap-6">
									<div class="lg:col-span-4">
										<div class="bg-white/90 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/60 p-6 space-y-6 h-full">
											<div>
												<div class="flex items-center gap-4 mb-4">
													<h3 class="text-lg font-semibold text-slate-900 dark:text-white">${t("friend_profile_personal_info_title")}</h3>
													<div class="h-px flex-1 bg-slate-200/70 dark:bg-slate-700/70"></div>
												</div>
												<div class="divide-y divide-slate-200/70 dark:divide-slate-700/70">
													<div class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
														<span class="text-sm text-slate-500 dark:text-slate-400">${t("friend_profile_label_full_name")}</span>
														<span class="text-base font-medium text-slate-900 dark:text-white">${fullName}</span>
													</div>
													<div class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
														<span class="text-sm text-slate-500 dark:text-slate-400">${t("friend_profile_label_username")}</span>
														<span class="text-base font-medium text-slate-900 dark:text-white">@${friend.username}</span>
													</div>
													<div class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
														<span class="text-sm text-slate-500 dark:text-slate-400">${t("friend_profile_label_email")}</span>
														<span class="text-base font-medium text-slate-900 dark:text-white">${friend.email}</span>
													</div>
													<div class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
														<span class="text-sm text-slate-500 dark:text-slate-400">${t("friend_profile_label_member_since")}</span>
														<span class="text-base font-medium text-slate-900 dark:text-white">${this.formatDate(friend.created_at)}</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div class="lg:col-span-2">
										<div class="bg-white/90 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/60 p-6 h-full">
											<h3 class="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-3">
												${t("friend_profile_bio_title")}
											</h3>
											<p class="text-slate-700 dark:text-slate-300 leading-relaxed ${bioClass}">
												${bio}
											</p>
										</div>
									</div>
								</div>

								<div class="bg-white/90 backdrop-blur-sm dark:bg-slate-900/80 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/60 p-6">
									<div class="flex items-center gap-4 mb-4">
										<h3 class="text-lg font-semibold text-slate-900 dark:text-white">${t("friend_profile_stats_title")}</h3>
										<div class="h-px flex-1 bg-slate-200/70 dark:bg-slate-700/70"></div>
									</div>
									<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
										<div class="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-center">
											<div class="text-xs uppercase tracking-widest text-slate-400 mb-2">${t("friend_profile_stats_total_games")}</div>
											<div class="text-2xl font-semibold text-slate-900 dark:text-white">0</div>
										</div>
										<div class="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-center">
											<div class="text-xs uppercase tracking-widest text-slate-400 mb-2">${t("friend_profile_stats_wins")}</div>
											<div class="text-2xl font-semibold text-slate-900 dark:text-white">0</div>
										</div>
										<div class="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-center">
											<div class="text-xs uppercase tracking-widest text-slate-400 mb-2">${t("friend_profile_stats_losses")}</div>
											<div class="text-2xl font-semibold text-slate-900 dark:text-white">0</div>
										</div>
										<div class="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-center">
											<div class="text-xs uppercase tracking-widest text-slate-400 mb-2">${t("friend_profile_stats_rank")}</div>
											<div class="text-2xl font-semibold text-slate-900 dark:text-white">-</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.updateMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private setupEvents(): void {
		const backButtons = this.querySelectorAll('.back-to-friends-btn');
		backButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				router.navigate('/friends');
			});
		});
		this.querySelectorAll('.message-friend-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				if (!this.friendId) return;
				router.navigate(`/chat?id=${this.friendId}`);
			});
		});
	}
}

customElements.define('friend-profile', FriendProfile);

export default FriendProfile;
