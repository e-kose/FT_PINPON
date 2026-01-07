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
				<div class="flex flex-col items-center justify-center py-8">
					<div class="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
					<p class="text-gray-400 text-sm">${t("friends_loading")}</p>
				</div>
			`;
		} else if (this.loadError) {
			content = `
				<div class="flex flex-col items-center justify-center py-8">
					<p class="text-red-500 text-sm">${t("friends_server_error")}</p>
				</div>
			`;
		} else if (!this.friends.length) {
			content = `
				<div class="flex flex-col items-center justify-center py-8">
					<p class="text-gray-400 text-sm">${t("friends_none")}</p>
				</div>
			`;
		} else {
			content = `<div class="grid grid-cols-1 gap-2">` + this.friends
				.map((friend) => {
					const isOnline = this.friendsOnlineStatus[friend.friend_id.toString()] || false;
					return `
					<div class="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
						<!-- Profile section - always visible -->
						<div class="profile-view-trigger flex items-center gap-2 sm:gap-3 cursor-pointer mb-2 sm:mb-3" data-id="${friend.friend_id}">
							<div class="relative flex-shrink-0">
								<img src="${friend.friend_avatar_url || "/default-avatar.png"}" 
									class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600" 
									alt="${t("friends_avatar_alt")}">
								<div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></div>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
									${friend.friend_username}
								</h3>
								<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
									${friend.friend_full_name || t("friends_fallback_no_name")}
								</p>
							</div>
						</div>
						
						<!-- Action buttons - responsive grid -->
						<div class="grid grid-cols-3 gap-1 sm:gap-1.5">
							<button class="view-profile-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 transition-colors min-h-[44px]" data-id="${friend.friend_id}">
								<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
								</svg>
								<span class="hidden sm:inline truncate">${t("friends_button_view_profile")}</span>
							</button>
							<button class="remove-friend-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 transition-colors min-h-[44px]" data-id="${friend.friend_id}">
								<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
								</svg>
								<span class="hidden sm:inline truncate">${t("friends_button_remove")}</span>
							</button>
							<button class="block-user-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-700 transition-colors min-h-[44px]" data-id="${friend.friend_id}">
								<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
								</svg>
								<span class="hidden sm:inline truncate">${t("friends_button_block")}</span>
							</button>
						</div>
					</div>
				`;}).join("") + `</div>`;
		}

		return `
			<aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4 max-h-none lg:max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
				<!-- Header -->
				<div class="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
					<h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">${t("friends_list_title")}</h2>
					${this.friends.length > 0 ? `
						<span class="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
							${this.friends.length}
						</span>
					` : ''}
				</div>
				<!-- Scrollable content -->
				<div class="flex-1 lg:overflow-y-auto -mr-2 pr-2">${content}</div>
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
			<section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-3 sm:p-4 lg:p-6 flex flex-col h-auto lg:h-[calc(100vh-6rem)]">
				${this.renderHeroSection()}
				${this.renderTabButtons()}
				<div class="overflow-visible lg:overflow-auto max-h-none lg:max-h-full -mr-2 pr-2">${this.renderActiveTabContent()}</div>
			</section>
		`;
	}

	private renderHeroSection(): string {
		return `
			<div class="mb-4 sm:mb-6">
				<div class="rounded-lg bg-gradient-to-r from-blue-800 to-indigo-800 p-3 sm:p-4 lg:p-6 shadow-lg text-white">
					<div class="w-full">
						<h3 class="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-1 sm:mb-2">${t("friends_header_title")}</h3>
						<p class="text-xs sm:text-sm text-blue-100/80 mb-3 sm:mb-4 text-center">${t("friends_header_description")}</p>
						<div class="flex flex-col sm:flex-row gap-2">
							<input id="usernameInput" class="flex-1 min-w-0 p-2 sm:p-3 text-base rounded bg-white/10 placeholder-blue-100/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60" placeholder="${t("friends_input_placeholder")}" aria-label="${t("friends_input_placeholder")}">
							<button id="addFriendBtn" class="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white text-blue-700 font-semibold rounded hover:opacity-90 transition-all whitespace-nowrap min-h-[44px]">
								${t("friends_input_button")}
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderTabButtons(): string {
		const tabConfig: Record<FriendsTab, string> = {
			incoming: t("friends_tab_incoming"),
			sent: t("friends_tab_sent"),
			blocked: t("friends_tab_blocked")
		};

		return `
			<div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
				${(Object.keys(tabConfig) as FriendsTab[])
					.map((tab) => {
						const isActive = this.activeTab === tab;
						const baseClasses =
							"flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded transition-colors text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]";
						const stateClasses = isActive
							? "bg-blue-600 text-white shadow-lg"
							: "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";
						return `<button id="tab-${tab}" class="${baseClasses} ${stateClasses}" data-tab="${tab}">${tabConfig[tab]}</button>`;
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
			return `<div class="flex justify-center py-8"><div class="w-8 h-8 border-3 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-4">${t("friends_server_error")}</p>`;
		}
		if (this.requests.length === 0) {
			return `<p class="text-gray-400 text-sm py-4">${t("friends_requests_none")}</p>`;
		}

		return `<div class="grid grid-cols-1 gap-2">` + this.requests
			.map((request) => `
				<div class="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors">
					<div class="profile-view-trigger flex items-center gap-2 sm:gap-3 cursor-pointer mb-2 sm:mb-3" data-id="${request.friend_id}">
						<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" alt="${t("friends_avatar_alt")}">
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">${request.friend_username}</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400 truncate">${request.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-3 gap-1 sm:gap-1.5">
						<button class="view-profile-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 transition-colors min-h-[44px]" data-id="${request.friend_id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_view_profile")}</span>
						</button>
						<button class="accept-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-700 transition-colors min-h-[44px]" data-id="${request.id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_accept")}</span>
						</button>
						<button class="reject-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 transition-colors min-h-[44px]" data-id="${request.id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_reject")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private renderSentRequests(): string {
		if (this.loading) {
			return `<div class="flex justify-center py-8"><div class="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-4">${t("friends_server_error")}</p>`;
		}
		if (this.sentRequests.length === 0) {
			return `<p class="text-gray-400 text-sm py-4">${t("friends_sent_none")}</p>`;
		}

		return `<div class="grid grid-cols-1 gap-2">` + this.sentRequests
			.map((request) => `
				<div class="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
					<div class="profile-view-trigger flex items-center gap-2 sm:gap-3 cursor-pointer mb-2 sm:mb-3" data-id="${request.friend_id}">
						<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" alt="${t("friends_avatar_alt")}">
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">${request.friend_username}</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400 truncate">${request.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-1 sm:gap-1.5">
						<button class="view-profile-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 transition-colors min-h-[44px]" data-id="${request.friend_id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_view_profile")}</span>
						</button>
						<button class="cancel-sent-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 transition-colors min-h-[44px]" data-id="${request.id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_cancel_request")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private renderBlockedUsers(): string {
		if (this.loading) {
			return `<div class="flex justify-center py-8"><div class="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div></div>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500 text-sm py-4">${t("friends_server_error")}</p>`;
		}
		if (this.blocked.length === 0) {
			return `<p class="text-gray-400 text-sm py-4">${t("friends_blocked_none")}</p>`;
		}

		return `<div class="grid grid-cols-1 gap-2">` + this.blocked
			.map((user) => `
				<div class="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-colors">
					<div class="profile-view-trigger flex items-center gap-2 sm:gap-3 cursor-pointer mb-2 sm:mb-3" data-id="${user.friend_id}">
						<img src="${user.friend_avatar_url || "/default-avatar.png"}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 grayscale" alt="${t("friends_avatar_alt")}">
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">${user.friend_username}</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400 truncate">${user.friend_full_name || t("friends_fallback_no_name")}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-1 sm:gap-1.5">
						<button class="view-profile-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 transition-colors min-h-[44px]" data-id="${user.friend_id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_view_profile")}</span>
						</button>
						<button class="unblock-btn flex items-center justify-center gap-1 px-2 py-2 text-[11px] sm:text-xs font-medium rounded-md text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-700 transition-colors min-h-[44px]" data-id="${user.friend_id}">
							<svg class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							<span class="hidden sm:inline truncate">${t("friends_button_unblock")}</span>
						</button>
					</div>
				</div>
			`).join("") + `</div>`;
	}

	private setupEvents(): void {
		const addBtn = this.querySelector("#addFriendBtn");
		const input = this.querySelector<HTMLInputElement>("#usernameInput");

		addBtn?.addEventListener("click", () => this.handleAddFriend(input));

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

		if (response.ok && data.success) {
			this.showToast(t("friends_toast_request_sent"), "success");
			if (input) {
				input.value = "";
			}
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
