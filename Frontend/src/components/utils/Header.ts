import { router } from "../../router/Router";
import { getUser} from "../../store/UserStore";
import { logout } from "../../store/AuthService";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";


class Header extends HTMLElement {
    private sidebarListener: SidebarStateListener | null = null;
  
    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        this.setupEvents();
        this.setupSidebarListener();
    }

    disconnectedCallback(): void {
        // Listener'ı temizle
        if (this.sidebarListener) {
            sidebarStateManager.removeListener(this.sidebarListener);
            this.sidebarListener = null;
        }
    }

    private render(): void {
        const user = getUser();
        this.innerHTML = `
            <nav class="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 shadow-xl border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-50">
                <div class="relative flex items-center h-24 px-6">
                    <!-- Logo Section - Sidebar ile çakışmaması için sağa kaydırıldı -->
                    <div id="logoSection" class="flex items-center space-x-4 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-105 ml-16" >
                        <img class="w-12 h-12 drop-shadow-lg" src="/pong.png" alt="logo">
                        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-wide">Ft_Transcendance</h1>
                    </div>
                    <!-- User Section -->
                    <div class="ml-auto flex items-center mr-6 relative select-none">
                        ${user ? `
                        <div id="userDropdownBtn" class="flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:shadow-xl transform hover:scale-105 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-600">
                            <!-- Avatar with Status Indicator -->
                            <div class="relative">
                                <img id="userAvatar" class="h-14 w-14 rounded-full border-3 border-gradient-to-r from-blue-500 to-purple-500 object-cover bg-white shadow-lg ring-2 ring-white dark:ring-gray-800" src="${user.profile?.avatar_url}" alt="Avatar">
                                <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse shadow-lg"></div>
                            </div>
                            
                            <!-- User Info -->
                            <div class="flex flex-col min-w-0">
                                <div class="flex items-center gap-2">
                                    <span id="username" class="text-xl font-bold text-gray-900 dark:text-white truncate max-w-32">${user.profile?.full_name || user.username}</span>
                                </div>
                            </div>
                            
                            <!-- Dropdown Arrow with Background -->
                            <div class="ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-all duration-300">
                                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300 transition-all duration-300" id="dropdownArrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        <div id="userDropdownMenu" class="hidden absolute right-0 top-20 w-64 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <!-- Menu Items -->
                            <div class="py-4">
                                <button id="profileBtn" class="flex items-center gap-4 w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 text-lg font-medium group">
                                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-semibold">Profilimi Gör</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">İstatistiklerin ve başarıların</div>
                                    </div>
                                </button>
                                
                                <button id="profileSettingsBtn" class="flex items-center gap-4 w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 text-lg font-medium group">
                                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                    </div>
                                    <div class="text-left">
                                        <div class="font-semibold">Profil Ayarları</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">Hesap ve tercihler</div>
                                    </div>
                                </button>
                                
                                <div class="border-t border-gray-200/50 dark:border-gray-600/50 mt-2 pt-2">
                                    <button id="logoutBtn" class="flex items-center gap-4 w-full px-6 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 text-lg font-medium group">
                                        <div class="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                                            <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                            </svg>
                                        </div>
                                        <div class="text-left">
                                            <div class="font-semibold">Çıkış Yap</div>
                                            <div class="text-sm text-red-400">Hesabından çık</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="flex items-center gap-3">
                            <button id="headerLoginBtn" class="text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold rounded-xl text-base px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">Giriş Yap</button>
                            <button id="headerSignupBtn" class="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 font-semibold rounded-xl text-base px-6 py-3 border-2 border-blue-200 dark:border-blue-700 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105">Kayıt Ol</button>
                        </div>
                        `}
                    </div>
                </div>
            </nav>
        `;
    }

    private setupEvents(): void {
        // Giriş yapılmadıysa buton eventleri
        const headerLoginBtn = this.querySelector('#headerLoginBtn');
        headerLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate("/login");
        });
        const headerSignupBtn = this.querySelector('#headerSignupBtn');
        headerSignupBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate("/signup");
        });
        // Profil Ayarları tıklanınca (şimdilik boş)
        const profileSettingsBtn = this.querySelector('#profileSettingsBtn');
        profileSettingsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            // Profil Ayarları fonksiyonu buraya yazılacak
        });

        // Logo click event - Ana sayfaya yönlendir
        const logoSection = this.querySelector('#logoSection');
        logoSection?.addEventListener('click', () => {
            this.handleLogoClick();
        });

        // User dropdown logic
        const dropdownBtn = this.querySelector('#userDropdownBtn');
        const dropdownMenu = this.querySelector('#userDropdownMenu');
        const dropdownArrow = this.querySelector('#dropdownArrow') as HTMLElement;
        let dropdownOpen = false;
        
        dropdownBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownOpen = !dropdownOpen;
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('hidden', !dropdownOpen);
                // Arrow animasyonu
                if (dropdownArrow) {
                    dropdownArrow.style.transform = dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            }
        });
        
        // Kapanma için dışarı tıkla
        document.addEventListener('click', () => {
            if (dropdownOpen && dropdownMenu) {
                dropdownMenu.classList.add('hidden');
                dropdownOpen = false;
                // Arrow'u geri çevir
                if (dropdownArrow) {
                    dropdownArrow.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Logout button event
        const logoutBtn = this.querySelector('#logoutBtn');
        logoutBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            const success = await logout();
            success ? router.navigate("/") : router.navigate("/error-500");
        });
        const profileBtn = this.querySelector('#profileBtn');
        profileBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate("/profile");
        });

       
    }

    private setupSidebarListener(): void {
        // State manager'dan sidebar durumunu dinle
        this.sidebarListener = (state) => {
            this.adjustLogoPosition(state.isCollapsed);
        };
        
        sidebarStateManager.addListener(this.sidebarListener);
    }

    private adjustLogoPosition(isCollapsed: boolean): void {
        const logoSection = this.querySelector('#logoSection');
        if (logoSection) {
            // Transition sınıflarını ekle
            const transitionClasses = sidebarStateManager.getTransitionClasses();
            logoSection.classList.add(...transitionClasses);
            
            if (isCollapsed) {
                // Sidebar kapalı - margin'i azalt
                logoSection.classList.remove('ml-72');
                logoSection.classList.add('ml-16');
            } else {
                // Sidebar açık - margin'i artır
                logoSection.classList.remove('ml-16');
                logoSection.classList.add('ml-72');
            }
        }
    }

    // Event Handler Methods
    private handleLogoClick(): void {
        // Ana sayfaya yönlendir
        router.navigate("/");
    }
   


}

customElements.define("header-component", Header);