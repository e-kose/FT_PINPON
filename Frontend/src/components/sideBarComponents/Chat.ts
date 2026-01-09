import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { getAccessToken, getUser } from "../../store/UserStore";
import type { Friend } from "../../types/FriendsType";
import ChatService from "../../services/ChatService";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "../utils/Layout";
import {
	getMultipleUsersOnlineStatus,
	getNotificationSocket,
	initializeNotifications,
	createNotification,
	getNotifications,
	markAllNotificationsAsRead,
	deleteNotification
} from "../../services/NotificationService";

class Chat extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private activeConversationId: string | null = null;
	private requestedConversationId: string | null = null;
	private messages: Record<string, any[]> = {};
	private socket: WebSocket | null = null;
	private friends: Friend[] = [];
	private isLoadingFriends = true;
	private friendsOnlineStatus: Record<string, boolean> = {};
	private onlineStatusInterval: number | null = null;
	private unreadMessageCounts: Record<string, number> = {};
	private eventListeners: Array<{ element: Element; type: string; handler: EventListener }> = [];
	private isFriendListOpen = false;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		const urlParams = new URLSearchParams(window.location.search);
		this.requestedConversationId = urlParams.get("id");
		void this.fetchFriends();
		this.startOnlineStatusInterval();
		this.setupNotificationListener();
		void this.loadUnreadMessageCounts();
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		this.socket?.close();
		this.socket = null;
		this.stopOnlineStatusInterval();

		// Event listener'ları temizle
		this.removeAllEventListeners();

		// Tüm state'i temizle - memory'de hiçbir şey kalmasın
		this.activeConversationId = null;
		this.messages = {};
		this.friends = [];
		this.isLoadingFriends = true;
		this.friendsOnlineStatus = {};
		this.unreadMessageCounts = {};
		this.isFriendListOpen = false;
		this.updateBodyScrollLock();
	}

	protected renderComponent(): void {
		const marginClass = sidebarStateManager.getMarginClass();
		this.innerHTML = `
			<style>
				@keyframes chat-float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-6px); }
				}
				@keyframes online-pulse {
					0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
					50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
				}
				.chat-container {
					background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.75), rgba(2, 6, 23, 0.65)),
						linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(8, 15, 28, 0.85));
					border: 1px solid rgba(148, 163, 184, 0.1);
					backdrop-filter: blur(12px);
				}
				.friend-card {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				}
				.friend-card:hover {
					transform: translateX(4px);
					background: linear-gradient(135deg, rgba(51, 65, 85, 0.5), rgba(30, 41, 59, 0.4));
				}
				.friend-card.active {
					background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.1));
					border-left: 3px solid #06b6d4;
				}
				.message-bubble-sent {
					background: linear-gradient(135deg, #06b6d4, #0891b2);
					border-radius: 1.25rem 1.25rem 0.25rem 1.25rem;
				}
				.message-bubble-received {
					background: linear-gradient(135deg, rgba(51, 65, 85, 0.8), rgba(30, 41, 59, 0.9));
					border-radius: 1.25rem 1.25rem 1.25rem 0.25rem;
				}
				.online-indicator {
					animation: online-pulse 2s ease-in-out infinite;
				}
				.chat-input-wrapper {
					background: linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.5));
					border: 1px solid rgba(148, 163, 184, 0.12);
					backdrop-filter: blur(8px);
				}
				.send-button {
					background: linear-gradient(135deg, #06b6d4, #0891b2);
					transition: all 0.3s ease;
				}
				.send-button:hover {
					background: linear-gradient(135deg, #0891b2, #0e7490);
					transform: scale(1.05);
					box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
				}
				.friends-panel {
					background: linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(8, 15, 28, 0.9));
					border: 1px solid rgba(148, 163, 184, 0.1);
					backdrop-filter: blur(12px);
				}
				.conversation-panel {
					background: linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(8, 15, 28, 0.88));
					border: 1px solid rgba(148, 163, 184, 0.1);
					backdrop-filter: blur(12px);
				}
				.chat-header {
					background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
					border-bottom: 1px solid rgba(148, 163, 184, 0.1);
				}
				.empty-chat-icon {
					animation: chat-float 3s ease-in-out infinite;
				}
			</style>
			
			<div class="min-h-screen bg-slate-950 bg-[url('/DashboardBackground.jpg')] bg-cover bg-center bg-fixed">
				<header-component></header-component>
				<div class="${PAGE_TOP_OFFSET}">
					<sidebar-component current-route="chat"></sidebar-component>
					<div id="mainContent" class="${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0">
						<div class="${APP_CONTAINER}">
							
							<!-- DESKTOP LAYOUT (lg+) -->
							<div class="hidden lg:grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] p-4 rounded-2xl chat-container">
								${this.renderDesktopFriendPanel()}
								${this.renderDesktopConversationPanel()}
							</div>

							<!-- MOBILE LAYOUT (<lg) -->
							<div class="lg:hidden h-[calc(100vh-7rem)] relative chat-container rounded-2xl overflow-hidden flex flex-col">
								${this.renderMobileLayout()}
							</div>

						</div>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.adjustMainContentMargin(sidebarStateManager.getState().isCollapsed);
		this.updateBodyScrollLock();
	}

	private async fetchFriends(): Promise<void> {
		this.isLoadingFriends = true;
		this.renderAndBind();

		try {
			const res = await ChatService.getFriendsList();
			if (res.ok && res.data.success && Array.isArray(res.data.friends)) {
				this.friends = res.data.friends;
				// Friend'lerin online durumlarını çek
				await this.fetchFriendsOnlineStatus();
				if (this.requestedConversationId) {
					const targetId = this.requestedConversationId;
					this.requestedConversationId = null;
					void this.loadConversation(targetId);
				}
			} else {
				this.friends = [];
			}
		} catch (error) {
			this.friends = [];
		} finally {
			if (this.requestedConversationId) {
				const targetId = this.requestedConversationId;
				this.requestedConversationId = null;
				void this.loadConversation(targetId);
			}
			this.isLoadingFriends = false;
			this.renderAndBind();
		}
	}

	private async fetchFriendsOnlineStatus(): Promise<void> {
		try {
			// Friend ID'lerini map'le
			const friendIds = this.friends.map(friend => friend.friend_id);

			if (friendIds.length === 0) {
				this.friendsOnlineStatus = {};
				return;
			}

			// Online durumlarını çek
			const onlineStatusResponse = await getMultipleUsersOnlineStatus(friendIds);

			if (onlineStatusResponse.ok && onlineStatusResponse.data.success) {
				// Response'dan gelen veriyi Record formatına çevir
				this.friendsOnlineStatus = {};
				if (onlineStatusResponse.data.data?.onlineStatus) {
					for (const statusItem of onlineStatusResponse.data.data.onlineStatus) {
						this.friendsOnlineStatus[statusItem.userId.toString()] = statusItem.isOnline;
					}
				}
			} else {
				this.friendsOnlineStatus = {};
			}
		} catch (error) {
			this.friendsOnlineStatus = {};
		}
	}

	private renderFriendListContent(): string {
		let content: string;

		if (this.isLoadingFriends) {
			content = `
				<div class="flex items-center justify-center py-8">
					<div class="flex flex-col items-center gap-3">
						<div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
						<p class="text-slate-400 text-sm">${t("chat_friends_loading")}</p>
					</div>
				</div>
			`;
		} else if (!this.friends.length) {
			content = `
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center mb-3 border border-slate-600/30">
						<span class="text-2xl">👥</span>
					</div>
					<p class="text-slate-400 text-sm">${t("chat_no_friends")}</p>
				</div>
			`;
		} else {
			content = this.friends
				.map((friend) => {
					const friendId = friend.friend_id;
					const isActive = this.activeConversationId === friendId.toString();
					const isOnline = this.friendsOnlineStatus[friendId.toString()] || false;
					const unreadCount = this.unreadMessageCounts[friendId.toString()] || 0;

					return `
						<div data-id="${friendId}"
							class="friend-card conversation-item flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isActive ? "active" : ""}">
							<div class="relative flex-shrink-0">
						<img src="${friend.friend_avatar_url}" class="w-11 h-11 rounded-xl object-cover border-2 ${isOnline ? 'border-cyan-500/50' : 'border-slate-600/50'}" alt="${t("chat_friend_avatar_alt")}">
								<div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500 online-indicator' : 'bg-slate-500'}"></div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 min-w-0">
									<div class="font-medium text-slate-100 truncate text-sm">${friend.friend_username}</div>
									${unreadCount > 0 ? `
										<span class="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full min-w-[18px] text-center font-bold shadow-lg shadow-rose-500/30">
											${unreadCount > 99 ? t("chat_unread_badge_overflow") : unreadCount}
										</span>
									` : ''}
								</div>
								<div class="flex items-center gap-1.5 mt-0.5">
									<span class="text-xs ${isOnline ? 'text-emerald-400' : 'text-slate-500'}">${isOnline ? t("chat_status_online") : t("chat_status_offline")}</span>
									${friend.friend_full_name ? `<span class="text-slate-600">•</span><span class="text-xs text-slate-500 truncate">${friend.friend_full_name}</span>` : ''}
								</div>
							</div>
							<svg class="w-4 h-4 text-slate-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</div>`;
				})
				.join("");
		}

		return `<div class="space-y-1">${content}</div>`;
	}

	private renderDesktopFriendPanel(): string {
		return `
			<div class="friends-panel rounded-xl lg:rounded-2xl p-4 overflow-hidden flex flex-col min-h-0 col-span-1">
				<div class="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
					<div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">👥</div>
					<div class="font-semibold text-white">${t("chat_friends_button")}</div>
				</div>
				<div class="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" data-friend-list="desktop-list">
					${this.renderFriendListContent()}
				</div>
			</div>
		`;
	}

	private renderDesktopConversationPanel(): string {
		return `
			<div class="conversation-panel rounded-xl lg:rounded-2xl col-span-2 flex flex-col overflow-hidden min-h-0">
				${this.activeConversationId ? this.renderConversationContent() : this.renderEmptyState()}
			</div>
		`;
	}

	private renderMobileLayout(): string {
		return `
			<!-- View 1: Friend List (Visible when no chat active) -->
			<div class="${this.activeConversationId ? 'hidden' : 'flex'} flex-col h-full w-full">
				<div class="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-900/50">
					<span class="text-xl">💬</span>
					<h2 class="text-lg font-bold text-white">${t("chat_sidebar_title")}</h2>
				</div>
				<div class="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700" data-friend-list="mobile-list">
					${this.renderFriendListContent()}
				</div>
			</div>

			<!-- View 2: Chat Overlay (Visible when chat active) -->
			${this.activeConversationId ? `
				<div class="absolute inset-0 z-50 bg-slate-900 flex flex-col h-full w-full">
					${this.renderMobileConversationHeader()}
					<div class="flex-1 overflow-y-auto px-4 py-2 messages scrollbar-thin scrollbar-thumb-slate-700">
						${this.renderMessagesHTML()}
					</div>
					<div class="p-3 bg-slate-900/90 border-t border-white/10">
						${this.renderInputArea()}
					</div>
				</div>
			` : ''}
		`;
	}

	private renderConversationContent(): string {
		return `
			${this.renderMessagesOwnerInfo()}
			<div class="flex-1 min-h-0 px-3 sm:px-4 overflow-y-auto messages p-3 mb-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
				${this.renderMessagesHTML()}
			</div>
			<div class="p-3 sm:p-4">
				<div class="chat-input-wrapper flex flex-col sm:flex-row gap-2 p-2 rounded-xl">
					${this.renderInputArea()}
				</div>
			</div>
		`;
	}

	private renderEmptyState(): string {
		return `
			<div class="flex flex-col items-center justify-center text-center h-full p-6">
				<div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center mb-5 border border-cyan-500/20">
					<span class="text-5xl empty-chat-icon">💬</span>
				</div>
				<p class="text-lg font-semibold text-slate-200 mb-2">${t("chat_empty_title")}</p>
				<p class="text-sm text-slate-500 max-w-xs">${t("chat_empty_description")}</p>
			</div>
		`;
	}

	private renderInputArea(): string {
		return `
			<div class="flex flex-row gap-2 w-full">
				<input class="chat-input flex-1 min-w-0 px-4 py-3 text-slate-100 bg-slate-800/60 border border-slate-600/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-sm min-h-[44px] placeholder-slate-500 transition-all" placeholder="${t("chat_input_placeholder")}" aria-label="${t("chat_input_placeholder")}">
				<button class="chat-send-btn send-button w-auto px-5 py-3 text-white rounded-xl font-medium min-h-[44px] flex items-center justify-center gap-2" aria-label="${t("chat_send_button_label")}">
					<span class="hidden sm:inline">${t("chat_send_button_label")}</span>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
					</svg>
				</button>
			</div>
		`;
	}

	private renderMobileConversationHeader(): string {
		const owner = this.friends.find((friend) => friend.friend_id.toString() === this.activeConversationId);
		if (!owner) return "";
		const isOnline = this.friendsOnlineStatus[this.activeConversationId || ""] || false;

		return `
			<div class="flex items-center gap-3 p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
				<button data-action="close-conversation" class="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700/50">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
				</button>
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<div class="relative flex-shrink-0">
						<img src="${owner.friend_avatar_url}" class="w-9 h-9 rounded-lg object-cover">
						<div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}"></div>
					</div>
					<div class="min-w-0">
						<div class="font-medium text-white truncate text-sm">${owner.friend_username}</div>
						<div class="text-xs text-slate-400">${isOnline ? t("chat_status_online") : t("chat_status_offline")}</div>
					</div>
				</div>
			</div>
		`;
	}

	private renderMessagesOwnerInfo(): string {
		if (!this.activeConversationId) return "";
		const owner = this.friends.find((friend) => friend.friend_id.toString() === this.activeConversationId);
		if (!owner) return "";

		const isOnline = this.friendsOnlineStatus[this.activeConversationId] || false;

		return `
			<div data-chat-header="true" class="chat-header flex flex-wrap sm:flex-nowrap sm:flex-row sm:items-center gap-3 p-4 min-w-0">
				<div class="flex items-center gap-3 min-w-0 flex-1">
					<div class="relative flex-shrink-0">
					<img src="${owner.friend_avatar_url}" class="w-11 h-11 rounded-xl object-cover border-2 ${isOnline ? 'border-cyan-500/50' : 'border-slate-600/50'}" alt="${t("chat_friend_avatar_alt")}">
						<div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500 online-indicator' : 'bg-slate-500'}"></div>
					</div>
					<div class="min-w-0 flex-1">
						<div class="font-semibold text-slate-100 truncate">${owner.friend_username}</div>
						<div class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
							<span class="text-xs ${isOnline ? 'text-emerald-400' : 'text-slate-500'}">${isOnline ? t("chat_status_online") : t("chat_status_offline")}</span>
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2 w-full sm:w-auto justify-end sm:ml-auto">
					<button class="w-9 h-9 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/30 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
						</svg>
					</button>
				</div>
			</div>
		`;
	}

	private renderMessagesHTML(): string {
		const messages = this.messages[this.activeConversationId || ""] || [];
		const currentUser = getUser();

		if (!messages.length) {
			return `
				<div class="flex flex-col items-center justify-center h-full text-center">
					<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/40 to-slate-800/40 flex items-center justify-center mb-3 border border-slate-600/20">
						<span class="text-2xl">✉️</span>
					</div>
					<p class="text-sm text-slate-500">${t("chat_no_messages_placeholder")}</p>
				</div>
			`;
		}

		return messages
			.map((message) => {
				const isMine = message.sender?.id === currentUser?.id;
				const bubbleClass = isMine ? "message-bubble-sent" : "message-bubble-received";
				const alignClass = isMine ? "justify-end" : "justify-start";

				return `
					<div class="flex ${alignClass} mb-3">
						<div class="${bubbleClass} px-4 py-2.5 break-words text-sm text-white shadow-lg max-w-[75%]">
							${message.content}
						</div>
					</div>
				`;
			})
			.join("");
	}

	private setupEvents(): void {
		// Önceki event listener'ları temizle
		this.removeAllEventListeners();

		const openDrawerBtn = this.querySelector('[data-action="open-friends-drawer"]');
		if (openDrawerBtn) {
			const handler = () => this.toggleFriendList(true);
			openDrawerBtn.addEventListener("click", handler);
			this.eventListeners.push({ element: openDrawerBtn, type: "click", handler });
		}

		this.querySelectorAll<HTMLElement>('[data-action="close-friends-drawer"]').forEach((item) => {
			const handler = () => this.toggleFriendList(false);
			item.addEventListener("click", handler);
			this.eventListeners.push({ element: item, type: "click", handler });
		});

		// Close conversation (back button on mobile)
		const closeConversationBtn = this.querySelector('[data-action="close-conversation"]');
		if (closeConversationBtn) {
			const handler = () => {
				this.activeConversationId = null;
				this.renderAndBind();
			};
			closeConversationBtn.addEventListener("click", handler);
			this.eventListeners.push({ element: closeConversationBtn, type: "click", handler });
		}

		this.querySelectorAll<HTMLElement>(".conversation-item").forEach((item) => {
			const handler = () => {
				const id = item.getAttribute("data-id");
				if (id) {
					this.handleConversationClick(id);
				}
			};
			item.addEventListener("click", handler);
			this.eventListeners.push({ element: item, type: "click", handler });
		});

		// Setup Inputs & Send Buttons
		this.querySelectorAll<HTMLInputElement>(".chat-input").forEach((input) => {
			const keyHandler = (event: Event) => {
				if ((event as KeyboardEvent).key === "Enter") {
					event.preventDefault();
					this.handleSend(input);
				}
			};
			input.addEventListener("keydown", keyHandler);
			this.eventListeners.push({ element: input, type: "keydown", handler: keyHandler });
		});

		this.querySelectorAll(".chat-send-btn").forEach((btn) => {
			const handler = (e: Event) => {
				// Butonun bulunduğu container içindeki input'u bul (sibling)
				// Yapı: div.flex.gap-2 > input + button
				// Bu yüzden parent element'in içinde .chat-input'u arayabiliriz
				const parent = (e.currentTarget as HTMLElement).parentElement;
				const input = parent?.querySelector(".chat-input") as HTMLInputElement;
				this.handleSend(input);
			};
			btn.addEventListener("click", handler);
			this.eventListeners.push({ element: btn, type: "click", handler });
		});
	}

	private async handleConversationClick(friendId: string): Promise<void> {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			this.connectWs();
		}

		// O kullanıcıdan gelen mesajları okundu olarak işaretle
		await this.markMessagesAsReadFromUser(friendId);

		await this.loadConversation(friendId);
		this.toggleFriendList(false);
	}

	private connectWs(): void {
		if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
			return;
		}

		const token = getAccessToken();
		if (!token) return;

		this.socket = ChatService.connectWebSocket(token);

		this.socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				if (message.type !== "message") return;

				const senderId = String(message.from);
				if (!this.messages[senderId]) {
					this.messages[senderId] = [];
				}

				this.messages[senderId].push({
					content: message.content,
					sender: { id: message.from },
					created_at: new Date().toISOString()
				});

				if (this.activeConversationId === senderId) {
					this.renderMessages();
				}
			} catch (error) {
			}
		};
	}

	private async loadConversation(friendId: string): Promise<void> {
		try {
			const res = await ChatService.getConversation(friendId);
			this.messages[friendId] = res.ok && res.data.success && Array.isArray(res.data.chat) ? res.data.chat : [];
			this.activeConversationId = friendId;
		} catch (error) {
			this.messages[friendId] = [];
			this.activeConversationId = friendId;
		} finally {
			this.renderAndBind();
			this.scrollMessagesToBottom();
		}
	}

	private toggleFriendList(forceOpen?: boolean): void {
		const nextState = typeof forceOpen === "boolean" ? forceOpen : !this.isFriendListOpen;
		if (this.isFriendListOpen === nextState) return;
		this.isFriendListOpen = nextState;
		this.renderAndBind();
	}

	private handleSend(sourceInput?: HTMLInputElement): void {
		let input: HTMLInputElement | null = sourceInput || null;

		if (!input) {
			// Fallback: find the first non-empty visible input or just the first input
			const inputs = this.querySelectorAll<HTMLInputElement>(".chat-input");
			for (const inp of Array.from(inputs)) {
				// Basit bir kontrol: eğer görünürse ve değeri varsa (veya sadece ilk bulduğunu al)
				// Ancak en doğrusu sourceInput'un gelmesi.
				if (inp.offsetParent !== null) { // Check visibility
					input = inp;
					break;
				}
			}
			if (!input && inputs.length > 0) input = inputs[0];
		}

		const currentUser = getUser();
		const socket = this.socket;

		if (!input || !currentUser || !socket || socket.readyState !== WebSocket.OPEN) return;

		const text = input.value.trim();
		if (!text || !this.activeConversationId) return;

		const conversationId = this.activeConversationId;

		if (!this.messages[conversationId]) {
			this.messages[conversationId] = [];
		}

		this.messages[conversationId].push({
			content: text,
			sender: { id: currentUser.id, username: currentUser.username },
			created_at: new Date().toISOString()
		});

		this.renderMessages();

		socket.send(
			JSON.stringify({
				recv_id: conversationId,
				content: text
			})
		);

		// Notification oluştur
		void this.createMessageNotification(parseInt(conversationId), text);

		// Clear all inputs
		this.querySelectorAll<HTMLInputElement>(".chat-input").forEach(el => el.value = "");
	}

	private renderMessages(): void {
		const containers = this.querySelectorAll(".messages");
		const html = this.renderMessagesHTML();
		containers.forEach(container => {
			container.innerHTML = html;
			container.scrollTop = container.scrollHeight;
		});
	}

	private scrollMessagesToBottom(): void {
		const containers = this.querySelectorAll(".messages");
		containers.forEach(container => {
			container.scrollTop = container.scrollHeight;
		});
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

	private startOnlineStatusInterval(): void {
		// Önceki interval'ı temizle
		this.stopOnlineStatusInterval();

		// 10 saniyede bir online status'ları güncelle
		this.onlineStatusInterval = window.setInterval(async () => {
			if (this.friends.length > 0) {
				await this.fetchFriendsOnlineStatus();
				// Sadece friend list ve conversation header'ı yeniden render et
				this.updateOnlineStatusUI();
			}
		}, 10000);
	}

	private stopOnlineStatusInterval(): void {
		if (this.onlineStatusInterval !== null) {
			clearInterval(this.onlineStatusInterval);
			this.onlineStatusInterval = null;
		}
	}

	private updateOnlineStatusUI(): void {
		const desktopList = this.querySelector('[data-friend-list="desktop-list"]');
		if (desktopList) {
			desktopList.innerHTML = this.renderFriendListContent();
		}

		const mobileList = this.querySelector('[data-friend-list="mobile-list"]');
		if (mobileList) {
			mobileList.innerHTML = this.renderFriendListContent();
		}

		// Conversation header'ı yeniden render et
		if (this.activeConversationId) {
			const conversationHeader = this.querySelector('[data-chat-header="true"]');
			if (conversationHeader) {
				conversationHeader.outerHTML = this.renderMessagesOwnerInfo();
			}
		}

		// Event'leri tekrar bağla
		this.setupEvents();
	}

	private setupNotificationListener(): void {
		// Notification socket'ini başlat
		void initializeNotifications();

		// Socket'i al ve message listener ekle
		setTimeout(() => {
			const notificationSocket = getNotificationSocket();
			if (notificationSocket) {
				// Mevcut onmessage handler'ı sakla
				const originalOnMessage = notificationSocket.onmessage;

				// Yeni handler ekle
				notificationSocket.onmessage = (event) => {
					// Orijinal handler'ı çağır
					if (originalOnMessage) {
						originalOnMessage.call(notificationSocket, event);
					}

					// Chat için özel logic
					this.handleNotificationMessage(event);
				};
			}
		}, 1000); // Socket bağlantısı için kısa bir bekleme
	}

	private handleNotificationMessage(event: MessageEvent): void {
		try {
			const message = JSON.parse(event.data);

			// Chat mesajı bildirimi kontrolü - sadece yeni oluşturulan notifications için
			if (message.type === 'notification' &&
			    message.data?.notification?.type === 'chat_message' &&
			    message.data?.action === 'created') {

				const notification = message.data.notification;
				const fromUserId = notification.from_user_id.toString();

				// Chat component'inin aktif olup olmadığını kontrol et
				const chatComponent = document.querySelector('chat-component');
				const isChatComponentActive = !!chatComponent && this.isConnected;

				// Eğer chat component aktif VE bu kişi ile aktif chat yapıyorsak, notification'ı sil
				if (this.activeConversationId === fromUserId && isChatComponentActive) {
					void this.deleteNotificationById(notification.id);
					return; // Badge güncelleme yok çünkü aktif chat'te
				}

				// Unread count'ı güncelle (sadece aktif chat değilse veya chat component aktif değilse)
				if (!this.unreadMessageCounts[fromUserId]) {
					this.unreadMessageCounts[fromUserId] = 0;
				}
				this.unreadMessageCounts[fromUserId]++;

				// UI'ı güncelle (sadece chat component aktifse)
				if (isChatComponentActive) {
					this.updateFriendListUI();
				}
			}
		} catch (error) {
		}
	}

	private async loadUnreadMessageCounts(): Promise<void> {
		try {
			// Chat mesajı tipindeki okunmamış bildirimleri al
			const response = await getNotifications({
				type: 'chat_message',
				is_read: false
			});

			if (response.ok && response.data.success && Array.isArray(response.data.data)) {
				// Her kullanıcıdan gelen mesaj sayısını hesapla
				this.unreadMessageCounts = {};
				response.data.data.forEach((notification: any) => {
					const fromUserId = notification.from_user_id.toString();
					if (!this.unreadMessageCounts[fromUserId]) {
						this.unreadMessageCounts[fromUserId] = 0;
					}
					this.unreadMessageCounts[fromUserId]++;
				});

				// UI'ı güncelle
				this.updateFriendListUI();
			}
		} catch (error) {
		}
	}

	private updateFriendListUI(): void {
		// Friend list container'ı bul ve yeniden render et
		const friendListContainer = this.querySelector('[data-friend-list="panel"] .divide-y');
		if (friendListContainer && this.friends.length > 0) {
			friendListContainer.innerHTML = this.friends
				.map((friend) => {
					const friendId = friend.friend_id;
					const isActive = this.activeConversationId === friendId.toString();
					const isOnline = this.friendsOnlineStatus[friendId.toString()] || false;
					const unreadCount = this.unreadMessageCounts[friendId.toString()] || 0;

					return `
						<div data-id="${friendId}"
							class="conversation-item flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isActive ? "bg-gray-100 dark:bg-gray-700" : ""}">
							<div class="relative">
						<img src="${friend.friend_avatar_url}" class="w-12 h-12 rounded-full" alt="${t("chat_friend_avatar_alt")}">
								<!-- Online/Offline Badge -->
								<div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 min-w-0">
									<div class="font-semibold text-gray-900 dark:text-gray-100 truncate">${friend.friend_username}</div>
									${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">${unreadCount > 99 ? t("chat_unread_badge_overflow") : unreadCount}</span>` : ''}
								</div>
								<div class="text-sm text-gray-500 dark:text-gray-400 truncate">${friend.friend_full_name || t("chat_friend_no_name")}</div>
							</div>
						</div>`;
				})
				.join("");

			// Event'leri tekrar bağla
			this.setupEvents();
		}

		const drawerContainer = this.querySelector('[data-friend-list="drawer"] .divide-y');
		if (drawerContainer && this.friends.length > 0) {
			drawerContainer.innerHTML = this.friends
				.map((friend) => {
					const friendId = friend.friend_id;
					const isActive = this.activeConversationId === friendId.toString();
					const isOnline = this.friendsOnlineStatus[friendId.toString()] || false;
					const unreadCount = this.unreadMessageCounts[friendId.toString()] || 0;

					return `
						<div data-id="${friendId}"
							class="conversation-item flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isActive ? "bg-gray-100 dark:bg-gray-700" : ""}">
							<div class="relative">
							<img src="${friend.friend_avatar_url}" class="w-12 h-12 rounded-full" alt="${t("chat_friend_avatar_alt")}">
								<!-- Online/Offline Badge -->
								<div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 min-w-0">
									<div class="font-semibold text-gray-900 dark:text-gray-100 truncate">${friend.friend_username}</div>
									${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">${unreadCount > 99 ? t("chat_unread_badge_overflow") : unreadCount}</span>` : ''}
								</div>
								<div class="text-sm text-gray-500 dark:text-gray-400 truncate">${friend.friend_full_name || t("chat_friend_no_name")}</div>
							</div>
						</div>`;
				})
				.join("");

			this.setupEvents();
		}
	}

	private async markMessagesAsReadFromUser(fromUserId: string): Promise<void> {
		try {
			// O kullanıcıdan gelen chat_message tipindeki bildirimleri okundu olarak işaretle
			const response = await markAllNotificationsAsRead({
				type: 'chat_message',
				from_user_id: parseInt(fromUserId)
			});

			if (response.ok && response.data.success) {
				// Unread count'ı sıfırla
				this.unreadMessageCounts[fromUserId] = 0;
				// UI'ı güncelle
				this.updateFriendListUI();
			}
		} catch (error) {
		}
	}

	private async createMessageNotification(toUserId: number, message: string): Promise<void> {
		try {
			const currentUser = getUser();
			if (!currentUser) return;

			await createNotification({
				to_user_id: toUserId,
				title: t("chat_notification_title_new_message", { username: currentUser.username }),
				message: message.length > 50 ? message.substring(0, 50) + '...' : message,
				type: 'chat_message'
			});
		} catch (error) {
		}
	}

	private async deleteNotificationById(notificationId: number): Promise<void> {
		try {
			const response = await deleteNotification(notificationId);
			if (!response.ok || !response.data.success) {
			}
		} catch (error) {
		}
	}

	private removeAllEventListeners(): void {
		this.eventListeners.forEach(({ element, type, handler }) => {
			element.removeEventListener(type, handler);
		});
		this.eventListeners = [];
	}

	private updateBodyScrollLock(): void {
		const shouldLock = this.isFriendListOpen || sidebarStateManager.getState().isMobileOpen;
		document.body.classList.toggle("overflow-hidden", shouldLock);
	}
}

customElements.define("chat-component", Chat);
export { Chat };
