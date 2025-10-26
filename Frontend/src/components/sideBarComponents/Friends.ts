import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import type { Friend, BlockedUser, SentRequest, ReceivedRequest } from "../../types/FriendsType";
import { getUser } from "../../store/UserStore";
import FriendService from "../../services/FriendService";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

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

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		void this.fetchData();
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
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
				<div class="pt-16 md:pt-20 lg:pt-24">
					<sidebar-component current-route="friends"></sidebar-component>
					<div id="mainContent" class="${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300">
						<style>
							@keyframes slide-in {
								from { transform: translateX(100%); opacity: 0; }
								to { transform: translateX(0); opacity: 1; }
							}
							.animate-slide-in {
								animation: slide-in 0.3s ease-out;
							}
						</style>
						<div class="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)]">
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
			content = `<p class="text-gray-400">${t("friends_loading")}</p>`;
		} else if (this.loadError) {
			content = `<p class="text-red-500">${t("friends_server_error")}</p>`;
		} else if (!this.friends.length) {
			content = `<p class="text-gray-400">${t("friends_none")}</p>`;
		} else {
			content = this.friends
				.map((friend) => `
					<div class="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
						<img src="${friend.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full" alt="${t("friends_avatar_alt")}">
						<div class="flex-1">
							<div class="font-semibold text-gray-900 dark:text-gray-100">${friend.friend_username}</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">${friend.friend_full_name || t("friends_fallback_no_name")}</div>
						</div>
						<div class="flex gap-2">
							<button class="remove-friend-btn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors" data-id="${friend.friend_id}">
								${t("friends_button_remove")}
							</button>
							<button class="block-user-btn px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors" data-id="${friend.friend_id}">
								${t("friends_button_block")}
							</button>
						</div>
					</div>
				`)
				.join("");
		}

		return `
			<aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 max-h-[calc(100vh-6rem)] overflow-auto">
				<div class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">${t("friends_list_title")}</div>
				<div class="divide-y overflow-auto max-h-[70vh]">${content}</div>
			</aside>
		`;
	}

	private renderManagementSection(): string {
		return `
			<section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-6 flex flex-col h-[calc(100vh-6rem)]">
				${this.renderHeroSection()}
				${this.renderTabButtons()}
				<div class="overflow-auto">${this.renderActiveTabContent()}</div>
			</section>
		`;
	}

	private renderHeroSection(): string {
		return `
			<div class="mb-6">
				<div class="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg text-white flex items-center gap-6">
					<div class="flex-1 p-4 sm:p-6">
						<h3 class="text-2xl font-bold text-center">${t("friends_header_title")}</h3>
						<p class="text-sm text-blue-100/80 mb-4 text-center">${t("friends_header_description")}</p>
						<div class="flex flex-col sm:flex-row gap-2">
							<input id="usernameInput" class="flex-1 p-3 rounded bg-white/10 placeholder-blue-100/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60" placeholder="${t("friends_input_placeholder")}" aria-label="${t("friends_input_placeholder")}">
							<button id="addFriendBtn" class="px-4 py-3 bg-white text-blue-700 font-semibold rounded hover:opacity-90 transition-all">
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
			<div class="flex gap-2 mb-4">
				${(Object.keys(tabConfig) as FriendsTab[])
					.map((tab) => {
						const isActive = this.activeTab === tab;
						const baseClasses =
							"px-3 py-2 rounded transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400";
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
			return `<p class="text-gray-400">${t("friends_loading")}</p>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500">${t("friends_server_error")}</p>`;
		}
		if (this.requests.length === 0) {
			return `<p class="text-gray-400">${t("friends_requests_none")}</p>`;
		}

		return this.requests
			.map(
				(request) => `
					<div class="flex justify-between items-center p-3 bg-gray-900/60 rounded border border-gray-700 mb-3">
						<div class="flex items-center gap-3">
							<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full" alt="${t("friends_avatar_alt")}">
							<div class="flex flex-col">
								<span class="text-white font-semibold">${request.friend_username}</span>
								<span class="text-sm text-gray-400">${request.friend_full_name || t("friends_fallback_no_name")}</span>
							</div>
						</div>
						<div class="flex gap-2">
							<button class="accept-btn px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" data-id="${request.id}">
								${t("friends_button_accept")}
							</button>
							<button class="reject-btn px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors" data-id="${request.id}">
								${t("friends_button_reject")}
							</button>
						</div>
					</div>
				`
			)
			.join("");
	}

	private renderSentRequests(): string {
		if (this.loading) {
			return `<p class="text-gray-400">${t("friends_loading")}</p>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500">${t("friends_server_error")}</p>`;
		}
		if (this.sentRequests.length === 0) {
			return `<p class="text-gray-400">${t("friends_sent_none")}</p>`;
		}

		return this.sentRequests
			.map(
				(request) => `
					<div class="flex justify-between items-center p-3 bg-gray-900/60 rounded border border-gray-700 mb-3">
						<div class="flex items-center gap-3">
							<img src="${request.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full" alt="${t("friends_avatar_alt")}">
							<div class="flex flex-col">
								<span class="text-white font-semibold">${request.friend_username}</span>
								<span class="text-sm text-gray-400">${request.friend_full_name || t("friends_fallback_no_name")}</span>
							</div>
						</div>
						<button class="cancel-sent-btn px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors" data-id="${request.id}">
							${t("friends_button_cancel_request")}
						</button>
					</div>
				`
			)
			.join("");
	}

	private renderBlockedUsers(): string {
		if (this.loading) {
			return `<p class="text-gray-400">${t("friends_loading")}</p>`;
		}
		if (this.loadError) {
			return `<p class="text-red-500">${t("friends_server_error")}</p>`;
		}
		if (this.blocked.length === 0) {
			return `<p class="text-gray-400">${t("friends_blocked_none")}</p>`;
		}

		return this.blocked
			.map(
				(user) => `
					<div class="flex justify-between items-center p-3 bg-gray-900/60 rounded border border-gray-700 mb-3">
						<div class="flex items-center gap-3">
							<img src="${user.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full" alt="${t("friends_avatar_alt")}">
							<div class="flex flex-col">
								<span class="text-white font-semibold">${user.friend_username}</span>
								<span class="text-sm text-gray-400">${user.friend_full_name || t("friends_fallback_no_name")}</span>
							</div>
						</div>
						<button class="unblock-btn px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" data-id="${user.friend_id}">
							${t("friends_button_unblock")}
						</button>
					</div>
				`
			)
			.join("");
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
			this.showToast(data.message || t("friends_toast_request_failed"), "error");
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
			this.showToast(response.data.message || t("friends_toast_action_failure"), "error");
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
			this.showToast(response.data.message || t(errorKey), "error");
		}
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
		mainContent.classList.toggle("ml-72", !isCollapsed);
		mainContent.classList.toggle("ml-16", isCollapsed);
	}

	private showToast(message: string, type: "success" | "error" | "info" = "info"): void {
		const toast = document.createElement("div");
		const baseClasses =
			"fixed top-20 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in transition-opacity duration-300";
		const colorClass =
			type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";

		toast.className = `${baseClasses} ${colorClass}`;
		toast.textContent = message;

		document.body.appendChild(toast);

		setTimeout(() => {
			toast.classList.add("opacity-0");
			setTimeout(() => toast.remove(), 300);
		}, 3000);
	}
}

customElements.define("friends-component", Friends);
export { Friends };
