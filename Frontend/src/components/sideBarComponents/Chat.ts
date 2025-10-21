import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { getAccessToken, getUser } from "../../store/UserStore";
import type { Friend } from "../../types/FriendsType";

class Chat extends HTMLElement {
	private sidebarListener: SidebarStateListener | null = null;
	private activeConversationId: string | null = null;
	private messages: Record<string, any[]> = {};
	private socket: WebSocket | null = null;
	private friends: Friend[] = [];



	constructor() {
		super();
		this.render();
	}

	connectedCallback(): void {
		this.setupSidebarListener();
		this.fetchFriends();
	}

	disconnectedCallback(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		this.socket?.close();
	}

	private async fetchFriends() {
		try {
			const res = await fetch("http://localhost:3000/friend/list", {
				headers: { Authorization: "Bearer " + getAccessToken() },
			});
			const data = await res.json();
			if (data.success && Array.isArray(data.friends)) {
				this.friends = data.friends;
				this.render();
			}
		} catch (err) {
			console.error("Arkadaş listesi alınamadı:", err);
		}
	}

	private connectWs(): void {
		const token = getAccessToken();
		if (!token) return;

		const socket = new WebSocket(
			"ws://localhost:3000/chat/ws?token=" + encodeURIComponent(token)
		);
		this.socket = socket;

			socket.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					if (msg.type === "message") {
						const senderId = msg.from;
						if (!this.messages[senderId]) this.messages[senderId] = [];
						this.messages[senderId].push({
							content: msg.content,
							sender: { id: senderId },
							created_at: new Date().toISOString(),
						});

						if (this.activeConversationId === senderId.toString()) {
							this.renderMessages();
						}
					}
				} catch (err) {
					console.error("WS parse hatası:", err);
				}
			};

		socket.onclose = () => {};
	}

	private async loadConversation(friendId: string) {
		const token = getAccessToken();
		try {
			const res = await fetch(`http://localhost:3000/chat/conversation/id/${friendId}`, {
				headers: { Authorization: "Bearer " + token },
			});
			const data = await res.json();

			this.messages[friendId] = (data.success && Array.isArray(data.chat)) ? data.chat : [];
			this.activeConversationId = friendId;
			this.render();
		} catch (err) {
			console.error("Konuşma alınamadı:", err);
			this.messages[friendId] = [];
			this.activeConversationId = friendId;
			this.render();
		}
	}

	private handleSend(): void {
		const input = this.querySelector<HTMLInputElement>("#chatInput");
		const currentUser = getUser();
		if (!input || !this.socket || !currentUser) return;

		const text = input.value.trim();
		if (!text || !this.activeConversationId) return;

		const recvId = this.activeConversationId;

		if (!this.messages[recvId]) this.messages[recvId] = [];
		this.messages[recvId].push({
			content: text,
			sender: { id: currentUser.id, username: currentUser.username },
			created_at: new Date().toISOString(),
		});
		this.renderMessages();

		this.socket.send(
			JSON.stringify({
				recv_id: recvId,
				content: text,
			})
		);

		input.value = "";
	}

	private renderMessagesOwnerInfo(): string {
		const owner = this.friends.find((f) => f.friend_id.toString() === this.activeConversationId);
		if (!owner) return "";
		return /*html*/ `
		  <div class="flex items-center gap-3 p-3 border-b">
			<img src="${`/Avatar/${owner.friend_id}.png`}" class="w-12 h-12 rounded-full" />
			<div>
			  <div class="font-semibold text-white">${owner.friend_username}</div>
			  <div class="text-sm text-gray-400">${owner.friend_email}</div>
			</div>
		  </div>`;
	}


	private render(): void {
		const marginClass = sidebarStateManager.getMarginClass();

		const friendListHtml = this.friends.length
			? this.friends
					.map((f) => {
						const friendId = f.friend_id;
						const isActive = this.activeConversationId === friendId.toString();

						return /*html*/`
						<div data-id="${friendId}"
							class="conversation-item flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isActive ? "bg-gray-100 dark:bg-gray-700" : ""}">
							<img src="${`/Avatar/${friendId}.png`}" class="w-12 h-12 rounded-full" />
							<div class="flex-1">
								<div class="font-semibold text-white">${f.friend_username}</div>
								<div class="text-sm text-gray-400">${f.friend_email}</div>
							</div>
						</div>`;
						})
					.join("")
			: `<p class="text-gray-400 text-sm">Henüz arkadaş yok.</p>`;

		const emptyChatHtml = `
      <div class="flex flex-col items-center justify-center text-center text-gray-400 h-full">
        <div class="text-6xl mb-4">💬</div>
        <p class="text-lg font-semibold">Sohbet etmeye başla!</p>
        <p class="text-sm text-gray-500">Arkadaşlarından birini seç ve konuşmaya başla.</p>
      </div>
    `;

		const chatContentHtml = /* html */`
		${this.renderMessagesOwnerInfo()}
	      <div class="flex-1 px-4 overflow-auto messages p-2 mb-3 ">
	        ${this.renderMessagesHTML()}
	      </div>
	        <div class="flex text-lg">
	          <input id="chatInput" class="flex-1 p-3 text-gray-300 bg-gray-900" placeholder="Mesaj yazın..." />
	          <button id="chatSend" class="p-3  bg-green-500 text-white">➤</button>
	        </div>
	    `;

		this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header-component></header-component>
        <div class="pt-16 md:pt-20 lg:pt-24">
          <sidebar-component current-route="chat"></sidebar-component>

          <div id="mainContent" class="${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300">
            <div class="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)]">

              <!-- Sol taraf -->
              <aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 max-h-[calc(100vh-6rem)] overflow-auto">
                <div class="text-lg text-amber-50 font-semibold mb-4">Sohbetler</div>
                <div class="divide-y overflow-auto max-h-[70vh]">
                  ${friendListHtml}
                </div>
              </aside>

              <!-- Sohbet alanı -->
              <section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border flex flex-col h-[calc(100vh-6rem)]">
				${this.activeConversationId ? chatContentHtml : emptyChatHtml}
              </section>
            </div>
          </div>
        </div>
      </div>
    `;
			this.setupEvents();
	}

	/** 🧩 Mesajları yeniden render et */
	private renderMessages(): void {
		const messagesEl = this.querySelector(".messages");
		if (messagesEl) messagesEl.innerHTML = this.renderMessagesHTML();
	}

	private renderMessagesHTML(): string {
		const msgs = this.messages[this.activeConversationId || ""] || [];
		const currentUser = getUser();
		return msgs
			.map((m) => {
				const isMine = m.sender?.id === currentUser?.id;
				return `
          <div class="flex ${isMine ? "justify-end" : "justify-start"}">
            <div class="max-w-[80%] ${isMine ? "text-white" : "text-gray-300"} p-2 my-1 rounded-2xl ${isMine ? "bg-green-600" : "bg-gray-900"
					}">
              <div>${m.content}</div>
            </div>
          </div>`;
			})
			.join("");
	}

	private setupEvents(): void {
		this.querySelectorAll(".conversation-item").forEach((item) => {
			item.addEventListener("click", async () => {
				const id = (item as HTMLElement).getAttribute("data-id");
				if (id)
				{
					if (this.socket?.OPEN !== WebSocket.OPEN)
						await this.connectWs();
					await this.loadConversation(id);
				}
			});
		});

		const sendBtn = this.querySelector("#chatSend");
		const input = this.querySelector<HTMLInputElement>("#chatInput");
		sendBtn?.addEventListener("click", () => this.handleSend());
		input?.addEventListener("keydown", (e) => {
			if ((e as KeyboardEvent).key === "Enter") this.handleSend();
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
		mainContent.classList.toggle("ml-72", !isCollapsed);
		mainContent.classList.toggle("ml-16", isCollapsed);
	}
}

customElements.define("chat-component", Chat);
export { Chat };
