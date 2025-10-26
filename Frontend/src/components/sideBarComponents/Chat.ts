import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { getAccessToken, getUser } from "../../store/UserStore";
import type { Friend } from "../../types/FriendsType";
import ChatService from "../../services/ChatService";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

class Chat extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private activeConversationId: string | null = null;
	private messages: Record<string, any[]> = {};
	private socket: WebSocket | null = null;
	private friends: Friend[] = [];
	private isLoadingFriends = true;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
		void this.fetchFriends();
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		this.socket?.close();
		this.socket = null;
	}

	protected renderComponent(): void {
		const marginClass = sidebarStateManager.getMarginClass();
		this.innerHTML = `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
				<header-component></header-component>
				<div class="pt-16 md:pt-20 lg:pt-24">
					<sidebar-component current-route="chat"></sidebar-component>
					<div id="mainContent" class="${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300">
						<div class="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)]">
							${this.renderFriendList()}
							${this.renderConversationArea()}
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

	private async fetchFriends(): Promise<void> {
		this.isLoadingFriends = true;
		this.renderAndBind();

		try {
			const res = await ChatService.getFriendsList();
			if (res.ok && res.data.success && Array.isArray(res.data.friends)) {
				this.friends = res.data.friends;
			} else {
				this.friends = [];
			}
		} catch (error) {
			console.error(t("chat_fetch_friends_error_log"), error);
			this.friends = [];
		} finally {
			this.isLoadingFriends = false;
			this.renderAndBind();
		}
	}

	private renderFriendList(): string {
		let content: string;

		if (this.isLoadingFriends) {
			content = `<p class="text-gray-400 text-sm">${t("chat_friends_loading")}</p>`;
		} else if (!this.friends.length) {
			content = `<p class="text-gray-400 text-sm">${t("chat_no_friends")}</p>`;
		} else {
			content = this.friends
				.map((friend) => {
					const friendId = friend.friend_id;
					const isActive = this.activeConversationId === friendId.toString();
					return `
						<div data-id="${friendId}"
							class="conversation-item flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isActive ? "bg-gray-100 dark:bg-gray-700" : ""}">
							<img src="${friend.friend_avatar_url || `/Avatar/${friendId}.png`}" class="w-12 h-12 rounded-full" alt="${t("chat_friend_avatar_alt")}">
							<div class="flex-1">
								<div class="font-semibold text-gray-900 dark:text-gray-100">${friend.friend_username}</div>
								<div class="text-sm text-gray-500 dark:text-gray-400">${friend.friend_full_name || t("chat_friend_no_name")}</div>
							</div>
						</div>`;
				})
				.join("");
		}

		return `
			<aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 max-h-[calc(100vh-6rem)] overflow-auto">
				<div class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">${t("chat_sidebar_title")}</div>
				<div class="divide-y overflow-auto max-h-[70vh]">${content}</div>
			</aside>
		`;
	}

	private renderConversationArea(): string {
		const conversationContent = this.activeConversationId
			? `
				${this.renderMessagesOwnerInfo()}
				<div class="flex-1 px-4 overflow-auto messages p-2 mb-3">
					${this.renderMessagesHTML()}
				</div>
				<div class="flex text-lg">
					<input id="chatInput" class="flex-1 p-3 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="${t("chat_input_placeholder")}" aria-label="${t("chat_input_placeholder")}">
					<button id="chatSend" class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-r-lg transition-colors" aria-label="${t("chat_send_button_label")}">➤</button>
				</div>
			`
			: `
				<div class="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 h-full p-6">
					<div class="text-6xl mb-4">💬</div>
					<p class="text-lg font-semibold mb-2">${t("chat_empty_title")}</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">${t("chat_empty_description")}</p>
				</div>
			`;

		return `
			<section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border flex flex-col h-[calc(100vh-6rem)]">
				${conversationContent}
			</section>
		`;
	}

	private renderMessagesOwnerInfo(): string {
		if (!this.activeConversationId) return "";
		const owner = this.friends.find((friend) => friend.friend_id.toString() === this.activeConversationId);
		if (!owner) return "";

		return `
			<div class="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60">
				<img src="${owner.friend_avatar_url || `/Avatar/${owner.friend_id}.png`}" class="w-12 h-12 rounded-full" alt="${t("chat_friend_avatar_alt")}">
				<div>
					<div class="font-semibold text-gray-900 dark:text-gray-100">${owner.friend_username}</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">${owner.friend_full_name || t("chat_friend_no_name")}</div>
				</div>
			</div>
		`;
	}

	private renderMessagesHTML(): string {
		const messages = this.messages[this.activeConversationId || ""] || [];
		const currentUser = getUser();

		if (!messages.length) {
			return `<div class="flex items-center justify-center h-full text-sm text-gray-400">${t("chat_no_messages_placeholder")}</div>`;
		}

		return messages
			.map((message) => {
				const isMine = message.sender?.id === currentUser?.id;
				const bubbleClass = isMine
					? "bg-green-600 text-white rounded-bl-2xl rounded-t-2xl"
					: "bg-gray-900 text-gray-200 rounded-br-2xl rounded-t-2xl";

				return `
					<div class="flex ${isMine ? "justify-end" : "justify-start"}">
						<div class="max-w-[80%] p-2 my-1 ${bubbleClass}">
							<div>${message.content}</div>
						</div>
					</div>
				`;
			})
			.join("");
	}

	private setupEvents(): void {
		this.querySelectorAll<HTMLElement>(".conversation-item").forEach((item) => {
			item.addEventListener("click", () => {
				const id = item.getAttribute("data-id");
				if (id) {
					this.handleConversationClick(id);
				}
			});
		});

		const sendBtn = this.querySelector("#chatSend");
		const input = this.querySelector<HTMLInputElement>("#chatInput");

		sendBtn?.addEventListener("click", () => this.handleSend());
		input?.addEventListener("keydown", (event) => {
			if ((event as KeyboardEvent).key === "Enter") {
				event.preventDefault();
				this.handleSend();
			}
		});
	}

	private async handleConversationClick(friendId: string): Promise<void> {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			this.connectWs();
		}
		await this.loadConversation(friendId);
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
				console.error(t("chat_ws_parse_error_log"), error);
			}
		};
	}

	private async loadConversation(friendId: string): Promise<void> {
		try {
			const res = await ChatService.getConversation(friendId);
			this.messages[friendId] = res.ok && res.data.success && Array.isArray(res.data.chat) ? res.data.chat : [];
			this.activeConversationId = friendId;
		} catch (error) {
			console.error(t("chat_fetch_conversation_error_log"), error);
			this.messages[friendId] = [];
			this.activeConversationId = friendId;
		} finally {
			this.renderAndBind();
			this.scrollMessagesToBottom();
		}
	}

	private handleSend(): void {
		const input = this.querySelector<HTMLInputElement>("#chatInput");
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

		input.value = "";
	}

	private renderMessages(): void {
		const messagesContainer = this.querySelector(".messages");
		if (messagesContainer) {
			messagesContainer.innerHTML = this.renderMessagesHTML();
			this.scrollMessagesToBottom();
		}
	}

	private scrollMessagesToBottom(): void {
		const messagesContainer = this.querySelector(".messages");
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
}

customElements.define("chat-component", Chat);
export { Chat };
