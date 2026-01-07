import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { router } from "../../router/Router";
import type { Friend, BlockedUser, SentRequest, ReceivedRequest } from "../../types/FriendsType";
import { getUser } from "../../store/UserStore";
import FriendService from "../../services/FriendService";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "../utils/Layout";
import { getMultipleUsersOnlineStatus } from "../../services/NotificationService";

type FriendsTab = "incoming" | "sent" | "blocked";

class Friends extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private loading = true;
	private loadError = false;
	private friends: Friend[] = [];
	private requests: ReceivedRequest[] = [];
	private blocked: BlockedUser[] = [];
	private sentRequests: SentRequest[] = [];
	private activeTab: FriendsTab = "incoming";
	private friendsOnlineStatus: Record<string, boolean> = {};
	private onlineStatusInterval: number | null = null;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		void this.fetchData();
		this.startOnlineStatusInterval();
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		this.stopOnlineStatusInterval();
		this.friendsOnlineStatus = {};
	}

	protected renderComponent(): void {
		const marginClass = sidebarStateManager.getMarginClass();
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
					<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10 text-center border border-white/20 dark:border-white/10">
						<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${t("friends_login_required_title")}</h2>
						<p class="text-gray-600 dark:text-gray-300">${t("friends_login_required_description")}</p>
					</div>
				</div>
			`;
			return;
		}

		this.innerHTML = `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
				<header-component></header-component>
				<div class="${PAGE_TOP_OFFSET}">
					<sidebar-component current-route="friends"></sidebar-component>
					<div id="mainContent" class="${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0">
						<style>
							@keyframes slide-in {
								from { transform: translateX(100%); opacity: 0; }
								to { transform: translateX(0); opacity: 1; }
							}
							.animate-slide-in {
								animation: slide-in 0.3s ease-out;
							}
						</style>
						<div class="${APP_CONTAINER} grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[calc(100vh-6rem)]">
							${this.renderFriendsList()}
							${this.renderManagementSection()}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.adjustMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private async fetchData(): Promise<void> {
		this.loading = true;
		this.loadError = false;
		this.renderAndBind();

		try {
			const [incomingRes, friendsRes, blockedRes, sentRes] = await Promise.all([
				FriendService.getIncomingRequests(),
				FriendService.getFriendsList(),
				FriendService.getBlocked(),
				FriendService.getSentRequests()
			]);

			this.requests = incomingRes.ok && incomingRes.data.success ? incomingRes.data.requests : [];
			this.friends = friendsRes.ok && friendsRes.data.success ? friendsRes.data.friends : [];
			this.blocked = blockedRes.ok && blockedRes.data.success ? blockedRes.data.blocked : [];
			this.sentRequests = sentRes.ok && sentRes.data.success ? sentRes.data.sent : [];
			
			// Fetch online status for friends
			await this.fetchFriendsOnlineStatus();
		} catch (error) {
			console.error(t("friends_fetch_error_log"), error);
			this.loadError = true;
			this.requests = [];
			this.friends = [];
			this.blocked = [];
			this.sentRequests = [];
		} finally {
			this.loading = false;
			this.renderAndBind();
		}
	}

	private renderFriendsList(): string {
		let content: string;

		if (this.loading) {
			content = `
				<div class="flex flex-col items-center justify-center py-12">
					<div class="relative w-16 h-16 mb-4">
						<div class="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
						<div class="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
					</div>
					<p class="text-gray-600 dark:text-gray-400 text-sm font-medium">${t("friends_loading")}</p>
				</div>
			`;
		} else if (this.loadError) {
			content = `
				<div class="flex flex-col items-center justify-center py-12">
					<div class="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
						<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<p class="text-red-600 dark:text-red-400 text-sm font-medium">${t("friends_server_error")}</p>
				</div>
			`;
		} else if (!this.friends.length) {
			content = `
				<div class="flex flex-col items-center justify-center py-12">
					<div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
						<svg class="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
					</div>
					<p class="text-gray-500 dark:text-gray-400 text-sm font-medium text-center">${t("friends_none")}</p>
					<p class="text-gray-400 dark:text-gray-500 text-xs text-center mt-1">Yeni arkadaş ekle!</p>
				</div>
			`;
		} else {
			content = `<div class="space-y-2">` + this.friends
				.map((friend) => {
					const isOnline = this.friendsOnlineStatus[friend.friend_id.toString()] || false;
					return `
					<div class="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/60 rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200">
						<!-- Profile section with enhanced design -->
						<div class="profile-view-trigger flex items-center gap-3 cursor-pointer mb-3" data-id="${friend.friend_id}">
							<div class="relative flex-shrink-0">
								<img src="${friend.friend_avatar_url || "/default-avatar.png"}" 
									class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-md" 
									alt="${t("friends_avatar_alt")}">
								<div class="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-3 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'} transition-all"></div>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate flex items-center gap-2">
									${friend.friend_username}
									${isOnline ? '<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>' : ''}
								</h3>
								<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
									${friend.friend_full_name || t("friends_fallback_no_name")}
								</p>
							</div>
						</div>
						
						<!-- Modern action buttons -->
						<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
							<button class="view-profile-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${friend.friend_id}">
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
								</svg>
								<span class="text-center leading-tight">${t("friends_button_view_profile")}</span>
							</button>
							<button class="remove-friend-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${friend.friend_id}">
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
								</svg>
								<span class="text-center leading-tight">${t("friends_button_remove")}</span>
							</button>
							<button class="block-user-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 min-h-[50px] sm:min-h-[44px] col-span-2 md:col-span-1" data-id="${friend.friend_id}">
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
								</svg>
								<span class="text-center leading-tight">${t("friends_button_block")}</span>
							</button>
						</div>
					</div>
				`;}).join("") + `</div>`;
		}

		return `
			<aside class="lg:col-span-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-4 sm:p-5 max-h-none lg:max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
				<!-- Modern Header -->
				<div class="flex items-center justify-between mb-4 pb-4 border-b-2 border-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
							</svg>
						</div>
						<h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">${t("friends_list_title")}</h2>
					</div>
					${this.friends.length > 0 ? `
						<span class="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-md">
							${this.friends.length}
						</span>
					` : ''}
				</div>
				<!-- Scrollable content with custom scrollbar -->
				<div class="flex-1 lg:overflow-y-auto lg:pr-2 lg:-mr-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">${content}</div>
			</aside>
		`;
	}

	private async fetchFriendsOnlineStatus(): Promise<void> {
		if (this.friends.length === 0) {
			this.friendsOnlineStatus = {};
			return;
		}

		try {
			const friendIds = this.friends.map(f => f.friend_id);
			const onlineStatusResponse = await getMultipleUsersOnlineStatus(friendIds);
			
			if (onlineStatusResponse.ok && onlineStatusResponse.data.success) {
				this.friendsOnlineStatus = {};
				if (onlineStatusResponse.data.data?.onlineStatus) {
					for (const statusItem of onlineStatusResponse.data.data.onlineStatus) {
						this.friendsOnlineStatus[statusItem.userId.toString()] = statusItem.isOnline;
					}
				}
			} else {
				console.error("Failed to fetch friends online status:", onlineStatusResponse);
				this.friendsOnlineStatus = {};
			}
		} catch (error) {
			console.error("Failed to fetch friends online status:", error);
			this.friendsOnlineStatus = {};
		}
	}

	private startOnlineStatusInterval(): void {
		this.stopOnlineStatusInterval();
		this.onlineStatusInterval = window.setInterval(async () => {
			await this.fetchFriendsOnlineStatus();
			this.renderAndBind();
		}, 30000); // Her 30 saniyede bir güncelle
	}

	private stopOnlineStatusInterval(): void {
		if (this.onlineStatusInterval) {
			clearInterval(this.onlineStatusInterval);
			this.onlineStatusInterval = null;
		}
	}

	private renderManagementSection(): string {
		return `
			<section class="lg:col-span-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-4 sm:p-5 lg:p-6 flex flex-col h-auto lg:h-[calc(100vh-6rem)]">
				${this.renderHeroSection()}
				${this.renderTabButtons()}
				<div class="overflow-visible lg:overflow-auto max-h-none lg:max-h-full lg:pr-2 lg:-mr-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">${this.renderActiveTabContent()}</div>
			</section>
		`;
	}

	private renderHeroSection(): string {
		return `
			<div class="mb-5 sm:mb-6">
				<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 p-5 sm:p-6 lg:p-7 shadow-xl border border-blue-700/40">
					<!-- Subtle geometric pattern background -->
					<div class="absolute inset-0 opacity-[0.03]">
						<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
									<path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/>
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#grid)" />
						</svg>
					</div>
					
					<div class="relative z-10 w-full">
						<!-- Header with icon -->
						<div class="flex items-start sm:items-center gap-4 mb-4">
							<div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-blue-800/60 rounded-2xl flex items-center justify-center shadow-md border border-blue-600/50">
								<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">${t("friends_header_title")}</h3>
								<p class="text-xs sm:text-sm text-blue-200/90 font-medium">${t("friends_header_description")}</p>
							</div>
						</div>
						
						<!-- Search input -->
						<div class="flex flex-col sm:flex-row gap-3">
							<div class="relative flex-1 group">
								<div class="relative">
									<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg class="w-5 h-5 text-blue-300/70 group-focus-within:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
										</svg>
									</div>
									<input id="usernameInput" 
										class="w-full pl-12 pr-4 py-3.5 text-base rounded-2xl bg-blue-950/40 border border-blue-500/30 text-white placeholder-blue-300/60 focus:bg-blue-900/40 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all font-medium" 
										placeholder="${t("friends_input_placeholder")}" 
										aria-label="${t("friends_input_placeholder")}">
								</div>
							</div>
							
							<!-- CTA button -->
							<button id="addFriendBtn" 
								class="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl min-h-[52px] transition-all duration-200 bg-blue-50 text-blue-900 hover:bg-white active:scale-95 border border-blue-200/60 shadow-sm hover:shadow-md">
								<div class="relative flex items-center justify-center gap-2.5 text-base font-bold whitespace-nowrap">
									<svg class="w-5 h-5 transition-transform group-hover:rotate-90 duration-300 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
									</svg>
									<span>${t("friends_input_button")}</span>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderTabButtons(): string {
		const tabConfig: Record<FriendsTab, {label: string, icon: string, count: number}> = {
			incoming: {
				label: t("friends_tab_incoming"),
				icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"/></svg>`,
				count: this.requests.length
			},
			sent: {
				label: t("friends_tab_sent"),
				icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>`,
				count: this.sentRequests.length
			},
			blocked: {
				label: t("friends_tab_blocked"),
				icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"/></svg>`,
				count: this.blocked.length
			}
		};

		return `
			<div class="flex flex-wrap gap-2 mb-4 sm:mb-5 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
				${(Object.keys(tabConfig) as FriendsTab[])
					.map((tab) => {
						const isActive = this.activeTab === tab;
						const config = tabConfig[tab];
						const baseClasses =
							"flex-1 sm:flex-none px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[48px] flex items-center justify-center gap-2";
						const stateClasses = isActive
							? "bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg scale-105"
							: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-102";
						return `
							<button id="tab-${tab}" class="${baseClasses} ${stateClasses}" data-tab="${tab}">
								${config.icon}
								<span>${config.label}</span>
								${config.count > 0 ? `<span class="px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'}">${config.count}</span>` : ''}
							</button>
						`;
					})
					.join("")}
			</div>
		`;
	}

	private renderActiveTabContent(): string {
		switch (this.activeTab) {
			case "incoming":
				return this.renderIncomingRequests();
			case "sent":
				return this.renderSentRequests();
			case "blocked":
				return this.renderBlockedUsers();
			default:
				return "";
		}
	}

	private renderIncomingRequests(): string {
		if (this.loading) {
			return `<div class="flex justify-center py-12"><div class="relative w-12 h-12"><div class="absolute inset-0 border-4 border-green-200 dark:border-green-900 rounded-full"></div><div class="absolute inset-0 border-4 border-green-600 dark:border-green-400 rounded-full border-t-transparent animate-spin"></div></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-6 text-center">${t("friends_server_error")}</p>`;
		}
		if (this.requests.length === 0) {
			return `<div class="flex flex-col items-center justify-center py-12">
				<div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
					<svg class="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<p class="text-gray-500 dark:text-gray-400 text-sm font-medium">${t("friends_requests_none")}</p>
			</div>`;
		}

		return `<div class="space-y-2">` + this.requests
			.map((request) => `
				<div class="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg transition-all duration-200">
					<div class="profile-view-trigger flex items-center gap-3 cursor-pointer mb-3" data-id="${request.friend_id}">
						<div class="relative flex-shrink-0">
							<div class="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
							<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-md" alt="${t("friends_avatar_alt")}">
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">${request.friend_username}</h3>
							<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">${request.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
						<button class="view-profile-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px] col-span-2 md:col-span-1" data-id="${request.friend_id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="text-center leading-tight">${t("friends_button_view_profile")}</span>
						</button>
						<button class="accept-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${request.id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
							<span class="text-center leading-tight">${t("friends_button_accept")}</span>
						</button>
						<button class="reject-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${request.id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							<span class="text-center leading-tight">${t("friends_button_reject")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private renderSentRequests(): string {
		if (this.loading) {
			return `<div class="flex justify-center py-12"><div class="relative w-12 h-12"><div class="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full"></div><div class="absolute inset-0 border-4 border-orange-600 dark:border-orange-400 rounded-full border-t-transparent animate-spin"></div></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-6 text-center">${t("friends_server_error")}</p>`;
		}
		if (this.sentRequests.length === 0) {
			return `<div class="flex flex-col items-center justify-center py-12">
				<div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
					<svg class="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
					</svg>
				</div>
				<p class="text-gray-500 dark:text-gray-400 text-sm font-medium">${t("friends_sent_none")}</p>
			</div>`;
		}

		return `<div class="space-y-2">` + this.sentRequests
			.map((request) => `
				<div class="group relative bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-xl p-3 sm:p-4 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg transition-all duration-200">
					<div class="profile-view-trigger flex items-center gap-3 cursor-pointer mb-3" data-id="${request.friend_id}">
						<div class="relative flex-shrink-0">
							<div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
							<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-md" alt="${t("friends_avatar_alt")}">
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">${request.friend_username}</h3>
							<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">${request.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<button class="view-profile-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${request.friend_id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="text-center leading-tight">${t("friends_button_view_profile")}</span>
						</button>
						<button class="cancel-sent-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${request.id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							<span class="text-center leading-tight">${t("friends_button_cancel_request")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private renderBlockedUsers(): string {
		if (this.loading) {
			return `<div class="flex justify-center py-12"><div class="relative w-12 h-12"><div class="absolute inset-0 border-4 border-red-200 dark:border-red-900 rounded-full"></div><div class="absolute inset-0 border-4 border-red-600 dark:border-red-400 rounded-full border-t-transparent animate-spin"></div></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-6 text-center">${t("friends_server_error")}</p>`;
		}
		if (this.blocked.length === 0) {
			return `<div class="flex flex-col items-center justify-center py-12">
				<div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 flex items-center justify-center">
					<svg class="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
					</svg>
				</div>
				<p class="text-gray-500 dark:text-gray-400 text-sm font-medium">${t("friends_blocked_none")}</p>
			</div>`;
		}

		return `<div class="space-y-2">` + this.blocked
			.map((user) => `
				<div class="group relative bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10 rounded-xl p-3 sm:p-4 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200">
					<div class="profile-view-trigger flex items-center gap-3 cursor-pointer mb-3" data-id="${user.friend_id}">
						<div class="relative flex-shrink-0">
							<img src="${user.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 border-gray-400 dark:border-gray-600 shadow-md grayscale opacity-70 group-hover:opacity-90 transition-all" alt="${t("friends_avatar_alt")}">
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"/>
									</svg>
								</div>
							</div>
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-sm sm:text-base text-gray-700 dark:text-gray-400 truncate">${user.friend_username}</h3>
							<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-500 truncate">${user.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<button class="view-profile-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${user.friend_id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="text-center leading-tight">${t("friends_button_view_profile")}</span>
						</button>
						<button class="unblock-btn flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 min-h-[50px] sm:min-h-[44px]" data-id="${user.friend_id}">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							<span class="text-center leading-tight">${t("friends_button_unblock")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private setupEvents(): void {
		const addBtn = this.querySelector("#addFriendBtn");
		const input = this.querySelector<HTMLInputElement>("#usernameInput");

		addBtn?.addEventListener("click", () => this.handleAddFriend(input));
		input?.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				this.handleAddFriend(input);
			}
		});

		this.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
			button.addEventListener("click", () => {
				const tab = button.getAttribute("data-tab") as FriendsTab | null;
				if (tab && tab !== this.activeTab) {
					this.activeTab = tab;
					this.renderAndBind();
				}
			});
		});

		this.querySelectorAll<HTMLElement>(".accept-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleFriendAction(btn, "accept"))
		);
		this.querySelectorAll<HTMLElement>(".reject-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleFriendAction(btn, "reject"))
		);

		this.querySelectorAll<HTMLElement>(".block-user-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleSimpleAction(btn, FriendService.blockUser, "friends_toast_block_success", "friends_toast_block_failure"))
		);

		this.querySelectorAll<HTMLElement>(".unblock-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleSimpleAction(btn, FriendService.unblockUser, "friends_toast_unblock_success", "friends_toast_unblock_failure"))
		);

		this.querySelectorAll<HTMLElement>(".remove-friend-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleSimpleAction(btn, FriendService.removeFriend, "friends_toast_remove_success", "friends_toast_remove_failure"))
		);

		this.querySelectorAll<HTMLElement>(".cancel-sent-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleSimpleAction(btn, FriendService.cancelSentRequest, "friends_toast_cancel_success", "friends_toast_cancel_failure"))
		);

		this.querySelectorAll<HTMLElement>(".view-profile-btn").forEach((btn) =>
			btn.addEventListener("click", () => this.handleViewProfile(btn))
		);

		this.querySelectorAll<HTMLElement>(".profile-view-trigger").forEach((trigger) =>
			trigger.addEventListener("click", () => this.handleViewProfile(trigger))
		);
	}

	private async handleAddFriend(input: HTMLInputElement | null): Promise<void> {
		const username = input?.value.trim();
		const currentUser = getUser();

		if (!username) {
			this.showToast(t("friends_toast_username_required"), "error");
			return;
		}

		if (currentUser && username === currentUser.username) {
			this.showToast(t("friends_toast_self_request"), "error");
			return;
		}

		const response = await FriendService.sendFriendRequest({ toUsername: username });
		const data = response.data || {};
		if (input) {
			input.value = "";
		}

		if (response.ok && data.success) {
			this.showToast(t("friends_toast_request_sent"), "success");
			await this.fetchData();
		} else {
			this.showToast(this.getFriendErrorMessage(data.message, "friends_toast_request_failed"), "error");
		}
	}

	private async handleFriendAction(button: HTMLElement, action: "accept" | "reject"): Promise<void> {
		const id = button.getAttribute("data-id");
		if (!id) return;

		const numericId = parseInt(id, 10);
		const response =
			action === "accept"
				? await FriendService.acceptRequest(numericId)
				: await FriendService.rejectRequest(numericId);

		if (response.ok && response.data.success) {
			this.showToast(t(action === "accept" ? "friends_toast_accept_success" : "friends_toast_reject_success"), "success");
			await this.fetchData();
		} else {
			this.showToast(this.getFriendErrorMessage(response.data.message, "friends_toast_action_failure"), "error");
		}
	}

	private async handleSimpleAction(
		button: HTMLElement,
		action: (id: number) => Promise<any>,
		successKey: string,
		errorKey: string
	): Promise<void> {
		const id = button.getAttribute("data-id");
		if (!id) return;

		const numericId = parseInt(id, 10);
		const response = await action(numericId);

		if (response.ok && response.data.success) {
			this.showToast(t(successKey), "success");
			await this.fetchData();
		} else {
			this.showToast(this.getFriendErrorMessage(response.data.message, errorKey), "error");
		}
	}

	private getFriendErrorMessage(message: unknown, fallbackKey: string): string {
		if (typeof message !== "string") {
			return t(fallbackKey);
		}

		// Global error config pattern kullanarak error mesajlarını yönet
		const errorMap: Record<string, string> = {
			"user not found": "friends_error_user_not_found",
			"already friends": "friends_error_already_friends",
			"blocked": "friends_error_request_blocked",
			"pending request": "friends_error_pending_request",
			"cannot send to self": "friends_error_self_request",
			"internal server error": "friends_error_server",
			"network error": "friends_error_network",
		};

		const normalized = message.toLowerCase();
		
		// Error mesajını map'te ara
		for (const [key, translationKey] of Object.entries(errorMap)) {
			if (normalized.includes(key)) {
				return t(translationKey);
			}
		}

		return t(fallbackKey);
	}

	private handleViewProfile(element: HTMLElement): void {
		const id = element.getAttribute("data-id");
		if (!id) return;
		const friendId = parseInt(id, 10);
		
		// Navigate to friend profile page with ID as path parameter
		router.navigate(`/friend/${friendId}`);
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => this.adjustMainContentMargin(state.isCollapsed);
		sidebarStateManager.addListener(this.sidebarListener);
	}

	private adjustMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector("#mainContent");
		if (!mainContent) return;
		const transitionClasses = sidebarStateManager.getTransitionClasses();
		mainContent.classList.add(...transitionClasses);
		mainContent.classList.add("ml-0");
		mainContent.classList.toggle("md:ml-72", !isCollapsed);
		mainContent.classList.toggle("md:ml-16", isCollapsed);
	}

	private showToast(message: string, type: "success" | "error" | "info" = "info"): void {
		let container = document.querySelector("#toastContainer") as HTMLElement | null;
		if (!container) {
			container = document.createElement("div");
			container.id = "toastContainer";
			container.className =
				"fixed top-20 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 w-[calc(100%-2rem)] max-w-sm flex flex-col gap-2";
			document.body.appendChild(container);
		}

		const toast = document.createElement("div");
		const baseClasses =
			"w-full text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in transition-opacity duration-300";
		const colorClass =
			type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";

		toast.className = `${baseClasses} ${colorClass}`;
		toast.textContent = message;

		container.appendChild(toast);

		setTimeout(() => {
			toast.classList.add("opacity-0");
			setTimeout(() => toast.remove(), 300);
		}, 3000);
	}
}

customElements.define("friends-component", Friends);
export { Friends };
