import './Header';
import './SideBar';
import { getUser } from '../../store/UserStore';
import { sidebarStateManager } from '../../router/SidebarStateManager';
import type { SidebarStateListener } from '../../router/SidebarStateManager';
import { router } from '../../router/Router';
import { disable2FA, enable2Fa, set2FA } from '../../services/AuthService';
import messages from './Messages';

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
		this.sidebarListener = (state: { isCollapsed: boolean }) => {
			const main = this.querySelector('.main-content');
			if (main) {
				main.classList.remove('ml-16', 'ml-72');
				main.classList.add(state.isCollapsed ? 'ml-16' : 'ml-72');
			}
		};
		sidebarStateManager.addListener(this.sidebarListener);
	}

	// Yükleniyor durumunu UI'da göstermek için (gerçek çağrıları ekleyeceğim)
	// setLoading(val:boolean) { ... }  // TODO: Yükleniyor overlay kontrolü burada olabilir.

	
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

	private handleVerify(code: string) {
		enable2Fa(code).then((res: boolean) => {
			if (res) {
				this.qrData = null;
				this.render();
				this.attachEvents();
				setTimeout(() => {
					router.navigate('/settings/security');
				}, 2000);
				messages.twoFaMessage('enable', true);
			} else {
        this.render();
        this.attachEvents();
        messages.twoFaMessage('enable', false);
			}
		});
	}

	private handleDisable() {
		disable2FA().then((res: boolean) => {
			if (res) {
				this.qrData = null; // QR artık gerekmez
				this.attachEvents();
				messages.twoFaMessage('disable', true);
				setTimeout(() => {
					router.navigate('/settings/security');
				}, 2000);
			} else {
				messages.twoFaMessage('disable', false);
			}
		});
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

	private attachEvents() {
		this.querySelector('[data-action="begin"]')?.addEventListener('click', () => this.startSetup());
		this.querySelector('[data-action="verify"]')?.addEventListener('click', () => this.submitCodeIfValid());

		this.querySelector('[data-action="disable"]')?.addEventListener('click', () => this.handleDisable());
		this.querySelector('[data-back]')?.addEventListener('click', () => router.navigate('/profile'));
		
		this.querySelector('[data-action="cancel-qr"]')?.addEventListener('click', () => {
			this.qrData = null; 
			this.render();
			this.attachEvents();
		});

		const codeInput = this.querySelector<HTMLInputElement>('#twofa-code');
		if (codeInput) {
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
              <div class="text-center mb-4">
                <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white inline-flex items-center gap-4 tracking-tight">
                  <span class="bg-blue-600 text-white p-2 rounded-lg">🔐</span>
                  İki Faktörlü Kimlik Doğrulama
                </h1>
                <p class="mt-3 text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium">Hesabınızı daha güvenli hale getirin</p>
                <div class="mt-4 w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto"></div>
              </div>
              
              <!-- Status Card -->
              <div class="relative overflow-hidden rounded-2xl shadow-md border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-800/95 mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
                <div class="p-5 xl:p-6 relative z-10 flex flex-col gap-5">
                  ${enabled ? `
                  <div class="flex flex-col items-center text-center gap-6">
                    <div class="w-16 h-16 rounded-2xl shadow-md flex items-center justify-center text-2xl text-white bg-gradient-to-br from-green-500 via-emerald-600 to-green-600 ring-4 ring-green-500/10">🔐</div>
                    <div class="flex flex-col items-center gap-4 w-full">
                      <div class="flex flex-wrap items-center justify-center gap-3">
                        <h2 class="text-2xl md:text-[30px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 dark:from-green-400 dark:via-emerald-400 dark:to-green-300">Güvenlik Durumu</h2>
                        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs md:text-sm font-semibold tracking-wide border-green-300/60 bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50">
                          <span class="inline-block h-3 w-3 rounded-full bg-green-500"></span>
                          Aktif
                        </span>
                      </div>
                      <div class='rounded-2xl border border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-green-900/20 p-6 w-full max-w-xl relative overflow-hidden'>
                        <div class="absolute -top-10 -right-10 w-40 h-40 bg-green-400/10 dark:bg-green-500/10 rounded-full"></div>
                        <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full"></div>
                        <div class='relative flex flex-col items-center text-center gap-5'>
                          <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md ring-4 ring-green-500/10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </div>
                          <div class='space-y-2 max-w-md'>
                            <p class='text-base md:text-lg font-semibold text-green-700 dark:text-green-300 tracking-tight'>İki Faktörlü Doğrulama Aktif</p>
                            <p class='text-xs md:text-sm text-green-700/80 dark:text-green-300/70 leading-relaxed'>Hesabınız ek güvenlik katmanıyla korunuyor. İsterseniz devre dışı bırakabilirsiniz.</p>
                          </div>
                          <div class='grid grid-cols-2 gap-4 text-[11px] md:text-xs w-full max-w-sm'>
                            <div class='rounded-lg bg-white/70 dark:bg-green-900/30 border border-green-300/40 dark:border-green-700/40 p-3 flex flex-col gap-0.5'>
                              <span class='font-semibold text-green-700 dark:text-green-300 text-xs'>Durum</span>
                              <span class='text-green-600 dark:text-green-200 font-semibold text-xs'>Aktif</span>
                            </div>
                            <div class='rounded-lg bg-white/70 dark:bg-green-900/30 border border-green-300/40 dark:border-green-700/40 p-3 flex flex-col gap-0.5'>
                              <span class='font-semibold text-green-700 dark:text-green-300 text-xs'>Koruma</span>
                              <span class='text-green-600 dark:text-green-200 font-semibold text-xs'>Yüksek</span>
                            </div>
                          </div>
                          <div class='text-[11px] md:text-[10px] text-green-700/70 dark:text-green-300/60 italic'>Yedek kodları güvenli bir yerde sakladığınızdan emin olun.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ` : `
                  <div class="flex items-start gap-4">
                    <div class="w-14 h-14 shrink-0 rounded-xl shadow-md flex items-center justify-center text-xl text-white bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 ring-4 ring-indigo-500/10">🔐</div>
                    <div class="flex-1 min-w-[240px] space-y-2.5">
                      <div class="flex flex-wrap items-center gap-2.5">
                        <h2 class="text-2xl md:text-[30px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 dark:from-blue-400 dark:via-indigo-400 dark:to-indigo-300">Güvenlik Durumu</h2>
                        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs md:text-sm font-semibold tracking-wide border-red-300/60 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50">
                          <span class="inline-block h-3 w-3 rounded-full bg-red-500"></span>
                          Pasif
                        </span>
                      </div>
                      <div class="mt-1 flex flex-col md:flex-row md:items-start gap-8">
                        <div class="flex-1 space-y-3 max-w-lg">
                          <p class="text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-300 font-medium">Hesabınıza ek güvenlik katmanı eklemek için önce kurulum sürecini başlatın, ardından uygulamada çıkan kodu doğrulayın.</p>
                          <ul class="space-y-2.5 text-xs md:text-sm">
                            <li class="flex items-start gap-2"><span class="mt-1 h-2 w-2 rounded-full bg-blue-500"></span><span class="text-gray-600 dark:text-gray-300">Google Authenticator, Microsoft Authenticator veya benzeri bir uygulama kullanabilirsiniz.</span></li>
                            <li class="flex items-start gap-2"><span class="mt-1 h-2 w-2 rounded-full bg-indigo-500"></span><span class="text-gray-600 dark:text-gray-300">Telefon değiştirirseniz yeni cihazda tekrar kurulum gerekir.</span></li>
                            <li class="flex items-start gap-2"><span class="mt-1 h-2 w-2 rounded-full bg-blue-500"></span><span class="text-gray-600 dark:text-gray-300">Kodlar 30 saniyede bir yenilenir.</span></li>
                          </ul>
                        </div>
                        <div class="w-full md:w-72 lg:w-80 relative">
                          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <span class="h-1 w-1 rounded-full bg-blue-500"></span> Adımlar
                          </h3>
                          <ol class="relative space-y-5 pl-0 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-blue-500/40 before:via-indigo-500/30 before:to-indigo-600/40">
                            <li class="relative pl-10">
                              <span class="absolute left-0 top-0 w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">1</span>
                              <div class="p-3 rounded-lg border border-blue-200/50 dark:border-indigo-700/40 bg-blue-50/60 dark:bg-indigo-900/20">
                                <p class="text-[11px] font-semibold text-blue-700 dark:text-indigo-200">Kurulumu Başlat</p>
                                <p class="text-[11px] mt-0.5 text-gray-600 dark:text-gray-400 leading-snug">QR kodu oluşturmak için butona bas.</p>
                              </div>
                            </li>
                            <li class="relative pl-10">
                              <span class="absolute left-0 top-0 w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">2</span>
                              <div class="p-3 rounded-lg border border-blue-200/50 dark:border-indigo-700/40 bg-blue-50/60 dark:bg-indigo-900/20">
                                <p class="text-[11px] font-semibold text-blue-700 dark:text-indigo-200">QR Kodunu Tara</p>
                                <p class="text-[11px] mt-0.5 text-gray-600 dark:text-gray-400 leading-snug">Authenticator uygulamasında yeni hesap ekle.</p>
                              </div>
                            </li>
                            <li class="relative pl-10">
                              <span class="absolute left-0 top-0 w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-blue-700 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">3</span>
                              <div class="p-3 rounded-lg border border-blue-200/50 dark:border-indigo-700/40 bg-blue-50/60 dark:bg-indigo-900/20">
                                <p class="text-[11px] font-semibold text-blue-700 dark:text-indigo-200">6 Haneli Kodu Gir</p>
                                <p class="text-[11px] mt-0.5 text-gray-600 dark:text-gray-400 leading-snug">Uygulamadaki güncel kodu doğrula.</p>
                              </div>
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                  `}

                  <!-- Global message host (below status card) -->
                  <div id="twofa-global-message" class="mt-2"></div>
                </div>
  <div class="relative z-10 border-t border-gray-100 dark:border-gray-700/70 bg-gray-50/70 dark:bg-gray-900/30 px-4 xl:px-6 py-5 flex items-center justify-center">
      ${!enabled ? `
    <button data-action="begin" class="inline-flex items-center gap-2.5 px-7 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:via-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/60 transition-all duration-300">
                      <svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M17 8l4 4m0 0l-4 4m4-4H3' /></svg>
                      Kurulumu Başlat
                    </button>
                  ` : `
    <button data-action="disable" class="inline-flex items-center gap-2.5 px-7 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/60 transition-all duration-300">
                      <svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12' /></svg>
                      Devre Dışı Bırak
                    </button>
                  `}
                </div>
              </div>

              <!-- QR & Verification -->
              ${showQR ? `
              <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 lg:p-8 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto backdrop-blur-sm backdrop-filter transition-all duration-300">
                <button data-action="cancel-qr" class="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-gray-300/70 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 backdrop-blur hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-colors duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  İptal
                </button>
                  <div class="text-center mb-5">
                    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-5 shadow-md">
                      📱
                    </div>
                    <h3 class="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-2 tracking-tight">Authenticator Uygulaması</h3>
                    <p class="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed font-medium">
                      Uygulamayla QR kodunu tarayın ve aşağıya gelen 6 haneli kodu girin
                    </p>
                  </div>

                  <div class="flex flex-col items-center gap-6 md:gap-7">
                    <div class="relative group">
                      <div class="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-20 group-hover:opacity-35 transition-all blur-md"></div>
                      <div class="relative p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner">
                        <img src="${this.qrData}" alt="2FA QR Code" class="w-[260px] h-[260px] md:w-[280px] md:h-[280px] object-contain rounded-md shadow-md" />
                      </div>
                    </div>

                    <div class="w-full max-w-sm mx-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 shadow-inner flex flex-col items-center">
                      <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 text-center tracking-wide uppercase">
                        6 Haneli Doğrulama Kodu
                      </label>
                      <input 
                        id="twofa-code" 
                        type="text" 
                        maxlength="6" 
                        placeholder="000000" 
                        class="w-full max-w-[200px] text-center text-xl font-mono tracking-[0.3em] px-3.5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <div class="flex items-center justify-center gap-2 mt-2">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Kod ~<span class="font-semibold">30 sn</span> içinde yenilenir
                        </p>
                      </div>
                    </div>

                    <button 
                      data-action="verify" 
                      class="w-full md:w-auto md:min-w-[240px] py-3 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:ring-2 focus:ring-green-500/30 outline-none text-sm tracking-tight flex items-center justify-center gap-2.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Doğrula ve Aktifleştir</span>
                    </button>

                    <div id="twofa-inline-message" class="w-full mt-3"></div>
                  </div>
                </div>
              ` : ''}

              <!-- Info Cards Grid -->
              <div class="grid md:grid-cols-2 gap-6 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
                <!-- Why 2FA Card -->
                <div class="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-500/30 dark:to-indigo-600/30 rounded-xl border border-blue-200 dark:border-blue-700/50 p-6 shadow-md hover:shadow-lg transition-all duration-300">
                  <div class="flex items-start gap-5">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl shadow-md transform -rotate-2 hover:rotate-0 transition-transform">
                      🛡️
                    </div>
                    <div class="flex-1">
                      <h4 class="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4 tracking-tight">
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
                      <h4 class="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-4 tracking-tight">
                        Önemli Bilgiler
                      </h4>
                      <div class="space-y-3">
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                          <span>Kurulum sonrası yedek kodları kaydedin</span>
                        </div>
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                          <span>Telefon değişirse yeniden kurulum gerekir</span>
                        </div>
                        <div class="flex items-start gap-3 text-base text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 p-2.5 pl-3 rounded-lg">
                          <span class="w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
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