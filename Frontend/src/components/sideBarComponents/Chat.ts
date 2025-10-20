import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { getAccessToken } from "../../store/UserStore";

class Chat extends HTMLElement {
  private sidebarListener: SidebarStateListener | null = null;
  private eventsInitialized = false;
  private conversations: any[] = [];
  private activeConversationId: string | null = null;
  private messages: Record<string, any[]> = {};
  private socket: WebSocket | null = null;

  constructor() {
    super();
    this.render();
  }

  connectedCallback(): void {
    this.setupSidebarListener();
    this.connectWs();
  }

  disconnectedCallback(): void {
    if (this.sidebarListener) {
      sidebarStateManager.removeListener(this.sidebarListener);
      this.sidebarListener = null;
    }
    this.socket?.close();
  }

  /** 🔹 WebSocket bağlantısı ve initial data fetch */
  private connectWs(): void {
    const token = getAccessToken();
    if (!token) {
      console.error("Token is missing, WebSocket connection could not be established.");
      return;
    }

    const socket = new WebSocket("ws://localhost:3000/chat/ws?token=" + encodeURIComponent(token));
    this.socket = socket;

    socket.onopen = async () => {
      console.log("✅ WebSocket connection opened");

      // ✅ Chat listesi çek
      const res = await fetch("http://localhost:3000/chat/conversations", {
        headers: { Authorization: "Bearer " + token },
      });

      const data = await res.json();
      console.log("Fetched conversation data:", data);
      if (data.success) {
        this.conversations = data.conversations;
        this.activeConversationId = data.conversations[0]?.partner?.id?.toString() ?? null;
        this.render();
        this.setupEvents();
      }

      // İlk aktif conversation’ın geçmişini de çekelim
      if (this.activeConversationId) {
        await this.loadConversation(this.activeConversationId);
      }
    };

    socket.onmessage = (event) => {
      console.log("📩 New message received:", event.data);
      try {
        const msg = JSON.parse(event.data);
        const convId = msg.conversationId?.toString() || this.activeConversationId;
        if (!convId) return;
        if (!this.messages[convId]) this.messages[convId] = [];
        this.messages[convId].push(msg);
        if (convId === this.activeConversationId) {
          const messagesEl = this.querySelector(".messages");
          if (messagesEl) messagesEl.innerHTML = this.renderMessagesHTML();
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket connection closed");
    };
  }

  /** 🔹 Aktif conversation’ın mesaj geçmişini yükler */
  private async loadConversation(conversationId: string) {
    const token = getAccessToken();
    const res = await fetch(`http://localhost:3000/chat/conversation/id/${conversationId}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (data.success) {
      this.messages[conversationId] = data.chat.messages || [];
      this.renderMessages();
    }
  }

  private render(): void {
    const marginClass = sidebarStateManager.getMarginClass();
    const c = this.getActiveConversation();
    const name = c?.partner?.username || "Kullanıcı";

    this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header-component></header-component>
        <div class="pt-16 md:pt-20 lg:pt-24">
          <sidebar-component current-route="chat"></sidebar-component>

          <div id="mainContent" class="${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300">
            <div class="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)]">

              <!-- 🧭 Chat listesi -->
              <aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 max-h-[calc(100vh-6rem)] overflow-auto">
                <div class="text-lg text-amber-50 font-semibold mb-4">Sohbetler</div>
                <div class="divide-y overflow-auto max-h-[70vh]">
                  ${this.conversations
                    .map(
                      (c) => `
                    <div data-id="${c.partner.id}"
                         class="conversation-item flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                           this.activeConversationId === c.partner.id.toString()
                             ? "bg-gray-100 dark:bg-gray-700"
                             : ""
                         }">
                      <img src="${c.partner.avatar_url}" class="w-12 h-12 rounded-full" />
                      <div class="flex-1">
                        <div class="font-semibold text-white">${c.partner.username}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-300">${
                          c.last_message?.content || ""
                        }</div>
                      </div>
                    </div>`
                    )
                    .join("")}
                </div>
              </aside>

              <!-- 💬 Chat alanı -->
              <section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 flex flex-col h-[calc(100vh-6rem)]">
                <div class="chat-header flex items-center justify-between border-b pb-3 mb-3">
                  <div class="flex items-center gap-3">
                    <img src="${c?.partner?.avatar_url}" class="w-12 h-12 rounded-full" />
                    <div>
                      <div class="font-semibold text-white">${name}</div>
                      <div class="text-sm text-lime-300">Çevrimiçi</div>
                    </div>
                  </div>
                  <div class="text-sm text-gray-500">Detaylar</div>
                </div>

                <div class="flex-1 overflow-auto messages p-2 mb-3 bg-white rounded">
                  ${this.renderMessagesHTML()}
                </div>

                <div class="mt-2">
                  <div class="flex gap-2">
                    <input id="chatInput" class="flex-1 p-2 border rounded" placeholder="Mesaj yazın..." />
                    <button id="chatSend" class="px-4 py-2 bg-blue-600 text-white rounded">Gönder</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderMessages(): void {
    const messagesEl = this.querySelector(".messages");
    if (messagesEl) messagesEl.innerHTML = this.renderMessagesHTML();
  }

  private renderMessagesHTML(): string {
    const msgs = this.messages[this.activeConversationId || ""] || [];
    return msgs
      .map(
        (m) => `
      <div class="p-2 my-1 ${
        m.from ? "bg-blue-100 ml-auto" : "bg-gray-100"
      } rounded w-max max-w-[80%]">
        ${m.content || m}
      </div>`
      )
      .join("");
  }

  private getActiveConversation() {
    return this.conversations.find(
      (x) => x.partner.id.toString() === this.activeConversationId
    );
  }

  private setupEvents(): void {
    if (this.eventsInitialized) return;

    // 🔹 Chat seçimi
    this.querySelectorAll(".conversation-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const id = (item as HTMLElement).getAttribute("data-id");
        if (id) {
          this.activeConversationId = id;
          await this.loadConversation(id);
          this.render();
          this.setupEvents();
        }
      });
    });

    // 🔹 Mesaj gönder
    const sendBtn = this.querySelector("#chatSend");
    const input = this.querySelector<HTMLInputElement>("#chatInput");
    sendBtn?.addEventListener("click", () => this.handleSend());
    input?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") this.handleSend();
    });

    this.eventsInitialized = true;
  }

  private handleSend(): void {
    const input = this.querySelector<HTMLInputElement>("#chatInput");
    if (!input || !this.socket) return;
    const text = input.value.trim();
    if (!text) return;
    const id = this.activeConversationId;
    if (!id) return;

    const msg = { conversationId: id, content: text };
    this.socket.send(JSON.stringify(msg));

    // UI’ye hemen ekle
    if (!this.messages[id]) this.messages[id] = [];
    this.messages[id].push({ content: text, from: "me" });
    this.renderMessages();
    input.value = "";
  }

  private setupSidebarListener(): void {
    this.sidebarListener = (state) => {
      this.adjustMainContentMargin(state.isCollapsed);
    };
    sidebarStateManager.addListener(this.sidebarListener);
  }

  private adjustMainContentMargin(isCollapsed: boolean): void {
    const mainContent = this.querySelector("#mainContent");
    if (!mainContent) return;
    const transitionClasses = sidebarStateManager.getTransitionClasses();
    mainContent.classList.add(...transitionClasses);
    if (isCollapsed) {
      mainContent.classList.remove("ml-72");
      mainContent.classList.add("ml-16");
    } else {
      mainContent.classList.remove("ml-16");
      mainContent.classList.add("ml-72");
    }
  }
}

customElements.define("chat-component", Chat);
export { Chat };
