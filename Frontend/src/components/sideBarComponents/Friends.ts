import "../utils/Header";
import "../utils/SideBar";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import type { Friend, BlockedUser, SentRequest, ReceivedRequest } from "../../types/FriendsType";
import { getUser } from "../../store/UserStore";
import FriendService from '../../services/FriendService';

class Friends extends HTMLElement {
  private sidebarListener: SidebarStateListener | null = null;
  private loading = true;
  private friends: Friend[] = [];
  private currentUser = getUser();
  private requests: ReceivedRequest[] = [];
  private blocked: BlockedUser[] = [];
  private sentRequests: SentRequest[] = [];
  private activeTab: 'incoming' | 'sent' | 'blocked' = 'incoming';

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
    try {
      const [incomingRes, friendsRes, blockedRes, sentRes] = await Promise.all([
        FriendService.getIncomingRequests(),
        FriendService.getFriendsList(),
        FriendService.getBlocked(),
        FriendService.getSentRequests(),
      ]);

      this.requests = incomingRes.ok && incomingRes.data.success ? incomingRes.data.requests : [];
      this.friends = friendsRes.ok && friendsRes.data.success ? friendsRes.data.friends : [];
      this.blocked = blockedRes.ok && blockedRes.data.success ? blockedRes.data.blocked : [];
      this.sentRequests = sentRes.ok && sentRes.data.success ? sentRes.data.sent : [];
      this.loading = false;

      this.render();
      this.setupEvents();
    } catch (err) {
      console.error("Friend fetch error", err);
      this.loading = false;
      this.innerHTML = `<p class="text-red-500">Sunucu hatası</p>`;
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    toast.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private render() {
    const marginClass = sidebarStateManager.getMarginClass();

    this.innerHTML = `
      <style>
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      </style>
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
          <img src="${f.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full" />
          <div class="flex-1">
            <div class="font-semibold text-white">${f.friend_username}</div>
            <div class="text-sm text-gray-400">${f.friend_full_name || "İsim yok"}</div>
          </div>
          <div class="flex gap-2">
            <button class="remove-friend-btn px-3 py-1 bg-red-600 text-white rounded" data-id="${f.friend_id}">Arkadaşlıktan çıkar</button>
            <button class="block-user-btn px-3 py-1 bg-yellow-600 text-white rounded" data-id="${f.friend_id}">Engelle</button>
          </div>
        </div>`
      )
      .join("");

    return this.wrapList("Arkadaşlar", list);
  }

  private renderRequestsAndForm(): string {
    const incomingHtml = this.loading
      ? `<p class="text-gray-400">Yükleniyor...</p>`
      : this.requests.length === 0
      ? `<p class="text-gray-400">Henüz istek yok.</p>`
      : this.requests
          .map(
            (r) => `
          <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700 mb-2">
            <div class="flex flex-row">
              <img src="${r.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full mr-3" />
              <div class="font-semibold text-white flex flex-col">
                <span>${r.friend_username}</span>
                <span class="text-sm text-gray-400">${r.friend_full_name || "İsim yok"}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="accept-btn px-3 py-1 bg-green-600 text-white rounded" data-id="${r.id}">Kabul Et</button>
              <button class="reject-btn px-3 py-1 bg-red-600 text-white rounded" data-id="${r.id}">Reddet</button>
            </div>
          </div>`
          )
          .join("");

    const sentHtml = this.loading
      ? `<p class="text-gray-400">Yükleniyor...</p>`
      : this.sentRequests.length === 0
      ? `<p class="text-gray-400">Henüz gönderilen istek yok.</p>`
      : this.sentRequests
          .map((s) => `
            <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700 mb-2">
              <div class="flex">
                <img src="${s.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full mr-3" />
                <div class="font-semibold text-white flex flex-col">
                  <span>${s.friend_username}</span>
                  <span class="text-sm text-gray-400">${s.friend_full_name || "İsim yok"}</span>
                </div>
              </div>
              <button class="cancel-sent-btn px-3 py-1 bg-red-600 text-white rounded" data-id="${s.id}">İsteği İptal Et</button>
            </div>
          `)
          .join("");

    const blockedHtml = this.loading
      ? `<p class="text-gray-400">Yükleniyor...</p>`
      : this.blocked.length === 0
      ? `<p class="text-gray-400">Henüz engellenen yok.</p>`
      : this.blocked
          .map((b) => `
            <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700 mb-2">
              <div class="flex">
                <img src="${b.friend_avatar_url || "/default-avatar.png"}" class="w-12 h-12 rounded-full mr-3" />
                <div class="font-semibold text-white flex flex-col">
                  <p class="text-white font-semibold">${b.friend_username}</p>
                  <p class="text-gray-400 text-sm">${b.friend_full_name || "İsim yok"}</p>
                </div>
              </div>
              <button class="unblock-btn px-3 py-1 bg-green-600 text-white rounded" data-id="${b.friend_id}">Engeli Kaldır</button>
            </div>
          `)
          .join("");

    const tabButtons = `
      <div class="flex gap-2 mb-4">
        <button id="tab-incoming" class="px-3 py-1 rounded ${this.activeTab === 'incoming' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}">Gelen İstekler</button>
        <button id="tab-sent" class="px-3 py-1 rounded ${this.activeTab === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}">Gönderilen İstekler</button>
        <button id="tab-blocked" class="px-3 py-1 rounded ${this.activeTab === 'blocked' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}">Engellediklerim</button>
      </div>
    `;

    const content = this.activeTab === 'incoming' ? incomingHtml : this.activeTab === 'sent' ? sentHtml : blockedHtml;

    return `
      <section class="lg:col-span-2 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow border p-6 flex flex-col h-[calc(100vh-6rem)]">

        <div class="mb-6">
          <div class="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg text-white flex items-center gap-6">
            <div class="flex-1 p-8">
              <h3 class="text-2xl font-bold text-center">Hemen Arkadaş Ekle</h3>
              <p class="text-sm text-blue-100/80 mb-3 text-center">Kullanıcı adını gir ve hemen arkadaş isteği gönder. Yeni bir arkadaşla oyun oyna veya sohbet başlat!</p>
              <div class="flex gap-2">
                <input style="color:white;" id="usernameInput" class="flex-1 p-3 rounded bg-white/10 placeholder-blue-100/60" placeholder="Kullanıcı adı gir (örn. alice)" />
                <button id="addFriendBtn" class="px-4 py-3 bg-white text-blue-700 font-semibold rounded hover:opacity-90">Ekle</button>
              </div>
            </div>
          </div>
        </div>

        ${tabButtons}
        <div class="overflow-auto">${content}</div>
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
    const addBtn = this.querySelector("#addFriendBtn");
    const input = this.querySelector<HTMLInputElement>("#usernameInput");

    const tabIncoming = this.querySelector('#tab-incoming');
    const tabSent = this.querySelector('#tab-sent');
    const tabBlocked = this.querySelector('#tab-blocked');

    tabIncoming?.addEventListener('click', () => { this.activeTab = 'incoming'; this.render(); this.setupEvents(); });
    tabSent?.addEventListener('click', () => { this.activeTab = 'sent'; this.render(); this.setupEvents(); });
    tabBlocked?.addEventListener('click', () => { this.activeTab = 'blocked'; this.render(); this.setupEvents(); });

    addBtn?.addEventListener("click", async () => {
      const username = input?.value.trim();
      if (!username) {
        this.showToast("Kullanıcı adı giriniz.", 'error');
        return;
      }
      if (this.currentUser && username === this.currentUser.username) {
        this.showToast("Kendine arkadaşlık isteği gönderemezsin.", 'error');
        return;
      }
      const r = await FriendService.sendFriendRequest({ toUsername: username });
      const data = r.data || {};
      if (r.ok && data.success) {
        this.showToast("Arkadaşlık isteği gönderildi!", 'success');
        input!.value = "";
        await this.fetchData();
      } else {
        this.showToast(data.message || "İstek gönderilemedi", 'error');
      }
    });

    this.querySelectorAll(".accept-btn").forEach((btn) => btn.addEventListener("click", () => this.handleFriendAction(btn, "accept")));
    this.querySelectorAll(".reject-btn").forEach((btn) => btn.addEventListener("click", () => this.handleFriendAction(btn, "reject")));

    this.querySelectorAll('.block-user-btn').forEach((btn) => btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).getAttribute('data-id');
      if (!id) return;
      const numeric = parseInt(id);
      const res = await FriendService.blockUser(numeric);
      if (res.ok && res.data.success) {
        this.showToast('Kullanıcı engellendi', 'success');
        await this.fetchData();
      } else {
        this.showToast(res.data.message || 'Engelleme başarısız', 'error');
      }
    }));

    this.querySelectorAll('.unblock-btn').forEach((btn) => btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).getAttribute('data-id');
      if (!id) return;
      const numeric = parseInt(id);
      const res = await FriendService.unblockUser(numeric);
      if (res.ok && res.data.success) {
        this.showToast('Engel kaldırıldı', 'success');
        await this.fetchData();
      } else {
        this.showToast(res.data.message || 'Engel kaldırılamadı', 'error');
      }
    }));

    this.querySelectorAll('.remove-friend-btn').forEach((btn) => btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).getAttribute('data-id');
      if (!id) return;
      const numeric = parseInt(id);
      const res = await FriendService.removeFriend(numeric);
      if (res.ok && res.data.success) {
        this.showToast('Arkadaşlıktan çıkarıldı', 'success');
        await this.fetchData();
      } else {
        this.showToast(res.data.message || 'İşlem başarısız', 'error');
      }
    }));

    this.querySelectorAll('.cancel-sent-btn').forEach((btn) => btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).getAttribute('data-id');
      if (!id) return;
      const numeric = parseInt(id);
      const res = await FriendService.cancelSentRequest(numeric);
      if (res.ok && res.data.success) {
        this.showToast('İstek iptal edildi', 'success');
        await this.fetchData();
      } else {
        this.showToast(res.data.message || 'İstek iptal edilemedi', 'error');
      }
    }));
  }

  private async handleFriendAction(btn: Element, action: "accept" | "reject") {
    const id = (btn as HTMLElement).getAttribute("data-id");
    if (!id) return;
    const numericId = parseInt(id);

    const res = action === "accept"
      ? await FriendService.acceptRequest(numericId)
      : await FriendService.rejectRequest(numericId);

    if (res.ok && res.status === 200) {
      this.showToast(action === "accept" ? "İstek kabul edildi!" : "İstek reddedildi!", 'success');
      await this.fetchData();
    } else {
      this.showToast(res.data.message || "İşlem başarısız oldu.", 'error');
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
