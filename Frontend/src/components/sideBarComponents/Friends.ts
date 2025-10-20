import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { getAccessToken } from "../../store/UserStore";

class Friends extends HTMLElement {
  private sidebarListener: SidebarStateListener | null = null;
  private loading = true;
  private friends: any[] = [];
  private requests: any[] = [];

  constructor() {
    super();
    this.render();
  }

  connectedCallback() {
    this.setupSidebarListener();
    this.fetchData();
  }

  disconnectedCallback() {
    if (this.sidebarListener) {
      sidebarStateManager.removeListener(this.sidebarListener);
      this.sidebarListener = null;
    }
  }

  private async fetchData() {
    const token = getAccessToken();
    if (!token) return;

    try {
      const [reqRes, friendsRes] = await Promise.all([
        fetch("http://localhost:3000/friend/requests", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("http://localhost:3000/friend/list", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);

      if (!reqRes.ok || !friendsRes.ok) {
        console.error("API error:", reqRes.status, friendsRes.status);
        this.innerHTML = `<p class="text-red-500">Sunucu hatası: ${reqRes.status}/${friendsRes.status}</p>`;
        return;
      }

      const [reqJson, friendsJson] = await Promise.all([
        reqRes.json(),
        friendsRes.json(),
      ]);

      this.requests = Array.isArray(reqJson) ? reqJson : [];
      this.friends = Array.isArray(friendsJson) ? friendsJson : [];
      this.loading = false;

      this.render();
      this.setupEvents();
    } catch (err) {
      console.error("Friend fetch error", err);
      this.innerHTML = `<p class="text-red-500">Sunucu hatası</p>`;
    }
  }

  private render() {
    const marginClass = sidebarStateManager.getMarginClass();

    this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header-component></header-component>
        <div class="pt-16 md:pt-20 lg:pt-24">
          <sidebar-component current-route="friends"></sidebar-component>

          <div id="mainContent" class="${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300">
            <div class="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)]">

              ${this.renderFriendsList()}
              ${this.renderRequestsAndForm()}

            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderFriendsList(): string {
    if (this.loading) {
      return this.wrapList("Arkadaşlar", `<p class="text-gray-400">Yükleniyor...</p>`);
    }

    if (this.friends.length === 0) {
      return this.wrapList("Arkadaşlar", `<p class="text-gray-400">Henüz arkadaş yok.</p>`);
    }

    const list = this.friends
      .map(
        (f) => `
        <div class="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <img src="${f.friend_avatar || "/default-avatar.png"}" class="w-12 h-12 rounded-full" />
          <div>
            <div class="font-semibold text-white">${f.friend_username}</div>
            <div class="text-sm text-gray-400">${f.friend_email}</div>
          </div>
        </div>`
      )
      .join("");

    return this.wrapList("Arkadaşlar", list);
  }

  private renderRequestsAndForm(): string {
    const requestsHtml = this.loading
      ? `<p class="text-gray-400">Yükleniyor...</p>`
      : this.requests.length === 0
      ? `<p class="text-gray-400">Henüz istek yok.</p>`
      : this.requests
          .map(
            (r) => `
          <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700 mb-2">
            <div>
              <p class="text-white font-semibold">${r.requester_username}</p>
              <p class="text-gray-400 text-sm">${r.requester_email}</p>
            </div>
            <div class="flex gap-2">
              <button class="accept-btn px-3 py-1 bg-green-600 text-white rounded" data-id="${r.id}">
                Kabul Et
              </button>
              <button class="reject-btn px-3 py-1 bg-red-600 text-white rounded" data-id="${r.id}">
                Reddet
              </button>
            </div>
          </div>`
          )
          .join("");

    return `
      <section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-6 flex flex-col h-[calc(100vh-6rem)]">
        <h2 class="text-xl font-semibold mb-4 text-white">Arkadaşlık İşlemleri</h2>

        <div class="flex gap-2 mb-6">
          <input style="color:white;" id="usernameInput" class="flex-1 p-2 border rounded" placeholder="Kullanıcı adı gir..." />
          <button id="addFriendBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Arkadaş Ekle
          </button>
        </div>

        <div class="overflow-auto">
          <h3 class="text-lg font-semibold mb-3 text-white">Gelen İstekler</h3>
          ${requestsHtml}
        </div>
      </section>
    `;
  }

  private wrapList(title: string, content: string): string {
    return `
      <aside class="lg:col-span-1 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-4 max-h-[calc(100vh-6rem)] overflow-auto">
        <div class="text-lg text-white font-semibold mb-4">${title}</div>
        <div class="divide-y overflow-auto max-h-[70vh]">${content}</div>
      </aside>
    `;
  }

  private setupEvents() {
    const token = getAccessToken();
    const addBtn = this.querySelector("#addFriendBtn");
    const input = this.querySelector<HTMLInputElement>("#usernameInput");

    addBtn?.addEventListener("click", async () => {
      const username = input?.value.trim();
      if (!username) return alert("Kullanıcı adı giriniz.");

      const res = await fetch("http://localhost:3000/friend/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ toUsername: username }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Arkadaşlık isteği gönderildi!");
        input!.value = "";
      } else {
        alert(data.message || "İstek gönderilemedi");
      }
    });

    this.querySelectorAll(".accept-btn").forEach((btn) =>
      btn.addEventListener("click", () => this.handleFriendAction(btn, "accept"))
    );

    this.querySelectorAll(".reject-btn").forEach((btn) =>
      btn.addEventListener("click", () => this.handleFriendAction(btn, "reject"))
    );
  }

  private async handleFriendAction(btn: Element, action: "accept" | "reject") {
    const id = (btn as HTMLElement).getAttribute("data-id");
    if (!id) return;
    const token = getAccessToken();

    const res = await fetch(`http://localhost:3000/friend/request/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });

    if (res.ok) {
      alert(action === "accept" ? "İstek kabul edildi!" : "İstek reddedildi!");
      this.fetchData();
    } else {
      alert("İşlem başarısız oldu.");
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

customElements.define("friends-component", Friends);
export { Friends };
