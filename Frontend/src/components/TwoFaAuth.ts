import '../components/Header';
import '../components/SideBar';
import { getUser } from '../store/UserStore';
import { sidebarStateManager } from '../router/SidebarStateManager';
import type { SidebarStateListener } from '../router/SidebarStateManager';
import { router } from '../router/Router';
import { enable2Fa, set2FA } from '../store/AuthService';

class TwoFaAuth extends HTMLElement {
	private sidebarListener: SidebarStateListener | null = null;
	// QR base64 verisi (logic sen ekleyeceksin)
	private qrData: string | null = null;
	// NOT: loading state ve overlay fonksiyonu şimdilik kaldırıldı (lint için). Gerekirse ekle.

	connectedCallback(): void {
		this.render();
		this.setupSidebarListener();
		this.attachEvents();
	}

	disconnectedCallback(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			const main = this.querySelector('.main-content');
			if (main) {
				main.classList.remove('ml-16', 'ml-72');
				main.classList.add(state.isCollapsed ? 'ml-16' : 'ml-72');
			}
		};
		sidebarStateManager.addListener(this.sidebarListener);
	}

	// Yükleniyor durumunu UI'da göstermek için (gerçek çağrıları sen ekle)
	// setLoading(val:boolean) { ... }  // TODO: Yükleniyor overlay kontrolü burada olabilir.

	// ---- Aşağıdaki methodlar PLACEHOLDER ----
	// Backend entegrasyonunu sen yazacaksın. İmzalara dokunma istersen.
  private async startSetup() {
    // Eğer tekrar tıklanırsa önceki state'i koru
    if (this.qrData) return; // zaten alınmış
    const result = await set2FA();
    if (result) {
      this.qrData = result; // base64 data:image/png;...
      this.render();
      this.attachEvents(); // yeniden render sonrası event'leri bağla
    } else {
      // Hata durumunda kullanıcıya kısa bilgi (basit - ileride showMessage ile geliştirilebilir)
      const msg = this.querySelector('#twofa-message');
      if (msg) {
        msg.className = 'text-sm mt-4 text-red-600';
        msg.textContent = 'QR kodu alınamadı. Tekrar deneyin.';
      }
    }
  }

  private handleVerify(code:string) {
    enable2Fa(code).then(res => {
      if (res) {
        // Kullanıcı store güncellendi, local UI'yi yenile
        this.qrData = null; // QR artık gerekmez
        this.render();
        this.attachEvents();
      } else {
        alert('Doğrulama başarısız. Tekrar deneyin.');
      }
    });
  }

	private handleDisable() {
		// TODO: 2FA disable endpoint çağır ve state'i güncelle.
	}

  private submitCodeIfValid() {
    const codeInput = this.querySelector<HTMLInputElement>('#twofa-code');
    if (!codeInput) return;
    const code = (codeInput.value || '').trim();
    if (!/^[0-9]{6}$/.test(code)) {
      alert('Lütfen 6 haneli sayısal kodu girin');
      codeInput.focus();
      return;
    }
    this.handleVerify(code);
  }

	// showMessage(msg:string, type:'success'|'error') { ... } // TODO: Mesaj gösterimi

  private attachEvents() {
    this.querySelector('[data-action="begin"]')?.addEventListener('click', () => this.startSetup());
    this.querySelector('[data-action="verify"]')?.addEventListener('click', () => this.submitCodeIfValid());
	
    this.querySelector('[data-action="disable"]')?.addEventListener('click', () => this.handleDisable());
    this.querySelector('[data-back]')?.addEventListener('click', () => router.navigate('/profile'));
	
    const codeInput = this.querySelector<HTMLInputElement>('#twofa-code');
	 if (codeInput) {
      // Sadece rakam girilsin
     	codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
      });
      // Enter ile gönder
      codeInput.addEventListener('keyup', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') this.submitCodeIfValid();
      });
    }
  }

	private render() {
		const user = getUser();
		const enabled = user?.is_2fa_enabled === 1;
    const showQR = !enabled && !!this.qrData; // QR geldiyse göster

		const sidebarState = sidebarStateManager.getState();
		const marginClass = sidebarState.isCollapsed ? 'ml-16' : 'ml-72';

		this.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <header-component></header-component>
        <div class="pt-16 md:pt-20 lg:pt-24">
          <sidebar-component current-route="2fa"></sidebar-component>
          <div class="main-content ${marginClass} p-4 sm:p-5 lg:p-6 2xl:p-8 transition-all duration-300">
            
            <div class="w-full mx-auto space-y-10">
              <!-- Page Title -->
              <div class="text-center mb-2">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-3">
                  <span class="bg-blue-600 text-white p-2 rounded-lg">🔐</span>
                  İki Faktörlü Kimlik Doğrulama
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-300">Hesabınızı daha güvenli hale getirin</p>
                <div class="mt-4 w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto"></div>
              </div>
              
              <!-- Status Card -->
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 xl:p-8 backdrop-blur-sm backdrop-filter bg-opacity-90 dark:bg-opacity-80 transition-all duration-300 hover:shadow-xl">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div class="flex items-center gap-4 flex-1">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-md transform transition-transform hover:rotate-2">
                      🔐
                    </div>
                    <div class="flex-1 min-w-[280px]">
                      <div class="flex flex-wrap items-center gap-2.5 mb-2">
                        <span class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-300 tracking-tight">Güvenlik Durumu</span>
                        <div class="flex items-center gap-2 px-3 py-1 rounded-full ${enabled ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'} shadow-inner">
                          <div class="w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse"></div>
                          <span class="text-sm font-semibold ${enabled ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
                            ${enabled ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                      <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-xl">
                        ${enabled
				? '2FA koruması aktif. Hesabınız ek bir güvenlik katmanıyla korunuyor.'
				: 'Hesabınıza ek güvenlik katmanı eklemek için 2FA kurulumunu tamamlayın.'
			}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex gap-3">
                    ${!enabled ? `
                      <button data-action="begin" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-blue-500/40 outline-none text-sm">
                        <span class="flex items-center gap-2">
                          <span>Kurulumu Başlat</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </button>
                    ` : `
                      <button data-action="disable" class="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-red-500/40 outline-none text-sm">
                        <span class="flex items-center gap-2">
                          <span>Devre Dışı Bırak</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      </button>
                    `}
                  </div>
                </div>
                
                <div id="twofa-message" class="text-sm mt-6"></div>
              </div>

              <!-- QR & Verification -->
              ${showQR ? `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 xl:p-7 backdrop-blur-sm backdrop-filter transition-all duration-300">
                  <div class="text-center mb-5">
                    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-md">
                      📱
                    </div>
                    <h3 class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-1 tracking-tight">Authenticator Uygulaması</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                      Uygulamayla QR kodunu tarayın ve aşağıya gelen 6 haneli kodu girin
                    </p>
                  </div>

                  <div class="flex flex-col items-center gap-6 md:gap-7">
                    <div class="relative group">
                      <div class="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-20 group-hover:opacity-35 transition-all blur-md"></div>
                      <div class="relative p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner">
                        <img src="${this.qrData}" alt="2FA QR Code" class="w-[260px] h-[260px] object-contain rounded-md shadow-md" />
                      </div>
                    </div>

                    <div class="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 shadow-inner">
                      <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center tracking-wide uppercase">
                        6 Haneli Doğrulama Kodu
                      </label>
                      <input 
                        id="twofa-code" 
                        type="text" 
                        maxlength="6" 
                        placeholder="000000" 
                        class="w-full text-center text-2xl font-mono tracking-[0.4em] px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                      />
                      <div class="flex items-center justify-center gap-2 mt-2.5">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Kod ~<span class="font-semibold">30 sn</span> içinde yenilenir
                        </p>
                      </div>
                    </div>

                    <button 
                      data-action="verify" 
                      class="w-full md:w-auto md:min-w-[260px] py-3.5 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-green-500/30 outline-none text-sm tracking-tight flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Doğrula ve Aktifleştir</span>
                    </button>

                    <div class="w-full mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500 dark:border-blue-400 shadow-sm">
                      <p class="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 leading-relaxed">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Kod doğru girildiğinde 2FA hemen aktif olur.
                      </p>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Info Cards Grid -->
              <div class="grid md:grid-cols-2 gap-8">
                <!-- Why 2FA Card -->
                <div class="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-500/30 dark:to-indigo-600/30 rounded-xl border border-blue-200 dark:border-blue-700/50 p-6 shadow-md hover:shadow-lg transition-all duration-300">
                  <div class="flex items-start gap-5">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl shadow-md transform -rotate-2 hover:rotate-0 transition-transform">
                      🛡️
                    </div>
                    <div class="flex-1">
                      <h4 class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4 tracking-tight">
                        Neden 2FA Kullanmalıyım?
                      </h4>
                      <div class="space-y-3">
                        <div class="flex items-center gap-3 text-base text-blue-800 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-900/30 p-2.5 pl-3 rounded-lg">
                          <div class="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                          <span>Şifre sızıntılarına karşı %99.9 koruma</span>
                        </div>
                        <div class="flex items-center gap-3 text-base text-blue-800 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-900/30 p-2.5 pl-3 rounded-lg">
                          <div class="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                          <span>Hesap ele geçirilmesini önler</span>
                        </div>
                        <div class="flex items-center gap-3 text-base text-blue-800 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-900/30 p-2.5 pl-3 rounded-lg">
                          <div class="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                          <span>Ücretsiz ve hızlı kurulum</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tips Card -->
                <div class="bg-gradient-to-br from-purple-500/10 to-pink-600/10 dark:from-purple-500/30 dark:to-pink-600/30 rounded-xl border border-purple-200 dark:border-purple-700/50 p-6 shadow-md hover:shadow-lg transition-all duration-300">
                  <div class="flex items-start gap-5">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-2xl shadow-md transform rotate-2 hover:rotate-0 transition-transform">
                      💡
                    </div>
                    <div class="flex-1">
                      <h4 class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-4 tracking-tight">
                        Önemli Bilgiler
                      </h4>
                      <div class="space-y-3">
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                          <span>Kurulum sonrası yedek kodları kaydedin</span>
                        </div>
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                          <span>Telefon değişirse yeniden kurulum gerekir</span>
                        </div>
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                          <span>Kodları sadece rakam olarak girin</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Back Button -->
              <div class="flex justify-center mt-6">
                <button data-back class="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Profil Sayfasına Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	}
}

customElements.define('twofa-auth', TwoFaAuth);
export default TwoFaAuth;