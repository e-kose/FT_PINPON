import { router } from "../../router/Router";
import { getUser } from "../../store/UserStore";
import { logout } from "../../services/AuthService";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

const ICONS = {
    menu: (className: string) => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
    `,
    chevronDown: (className: string) => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    `,
    user: (className: string) => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
    `,
    settings: (className: string) => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
    `,
    logout: (className: string) => `
        <svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
    `,
};

const ICON_BUTTON = "inline-flex items-center justify-center h-11 w-11 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition";
const BUTTON_PRIMARY = "text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg text-xs sm:text-sm md:text-base px-2.5 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 transition-colors shadow-sm";
const BUTTON_OUTLINE = "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 font-semibold rounded-lg text-xs sm:text-sm md:text-base px-2.5 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 border border-blue-200 dark:border-blue-700 transition-colors";
const SURFACE_ELEVATED = "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/70 dark:border-slate-800/70 rounded-xl shadow-xl";
const TEXT_MUTED = "text-[10px] sm:text-xs text-slate-500 dark:text-slate-400";

class Header extends LocalizedComponent {
    private sidebarListener: SidebarStateListener | null = null;
    private documentClickHandler: ((event: MouseEvent) => void) | null = null;
    private profileUpdateHandler: (() => void) | null = null;

    private cleanupDocumentClickHandler(): void {
        if (this.documentClickHandler) {
            document.removeEventListener("click", this.documentClickHandler);
            this.documentClickHandler = null;
        }
    }

    protected onConnected(): void {
        if (!this.sidebarListener) {
            this.setupSidebarListener();
        }
        this.setupProfileUpdateListener();
    }

    protected onDisconnected(): void {
        if (this.sidebarListener) {
            sidebarStateManager.removeListener(this.sidebarListener);
            this.sidebarListener = null;
        }
        this.cleanupDocumentClickHandler();
        this.cleanupProfileUpdateListener();
    }

    protected renderComponent(): void {
        const user = getUser();
        const sidebarState = sidebarStateManager.getState();
        const logoMarginClass = sidebarState.isCollapsed 
            ? 'md:ml-20 lg:ml-20' 
            : 'md:ml-[17rem] lg:ml-[17rem]';
        
        this.innerHTML = `
            <nav class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm fixed top-0 w-full z-50">
                <div class="w-full px-4 sm:px-6 lg:px-8 relative flex items-center justify-between gap-2 min-h-14 sm:min-h-16 md:min-h-20 lg:min-h-24 py-2 sm:py-3 min-w-0">
                    ${user ? `
                    <button id="mobileSidebarToggle" aria-label="${t("sidebar_toggle_aria")}" class="md:hidden ${ICON_BUTTON}">
                        ${ICONS.menu("w-5 h-5")}
                    </button>
                    ` : ""}
                    <!-- Logo Section - Sidebar ile senkronize yumuşak geçiş -->
                    <div id="logoSection" class="flex items-center gap-2 sm:gap-3 md:gap-4 cursor-pointer hover:opacity-90 min-w-0 flex-shrink-0 overflow-hidden pr-2 sm:pr-4 transition-all duration-300 ease-out ${logoMarginClass}" aria-label="${t("header_logo_aria")}" title="${t("header_logo_title")}">
                        <img class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0" src="/pong.png" alt="${t("header_logo_alt")}">
                        <h1 class="text-[11px] xs:text-sm sm:text-lg md:text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate max-w-full">${t("app_brand_name")}</h1>
                    </div>
                    <!-- Spacer for flexible layout -->
                    <div class="flex-1"></div>
                    <!-- User Section - Sağa yaslanmış ve responsive -->
                    <div class="flex items-center mr-2 sm:mr-4 md:mr-6 lg:mr-8 relative select-none flex-shrink-0">
                        ${user ? `
                        <div id="userDropdownBtn" class="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-3 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors min-w-0">
                            <!-- Avatar with Status Indicator -->
                            <div class="relative">
                                <img id="userAvatar" class="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full object-cover bg-white dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700" src="${user.profile?.avatar_url}" alt="${t("header_user_avatar_alt")}">
                                <div class="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                            </div>
                            
                            <!-- User Info - Hidden on mobile -->
                            <div class="hidden sm:flex flex-col min-w-0">
                                <div class="flex items-center gap-2">
                                    <span id="username" class="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate max-w-24 sm:max-w-28 md:max-w-32">${user.profile?.full_name || user.username}</span>
                                </div>
                            </div>
                            
                            <!-- Dropdown Arrow with Background -->
                            <div class="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors">
                                <span id="dropdownArrow" class="text-slate-500 dark:text-slate-300 transition-transform duration-200">
                                    ${ICONS.chevronDown("w-4 h-4")}
                                </span>
                            </div>
                        </div>
                        <div id="userDropdownMenu" class="hidden absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 w-[calc(100vw-2rem)] max-w-[22rem] sm:w-56 md:w-60 lg:w-64 ${SURFACE_ELEVATED} z-50 overflow-hidden">
                            <!-- Menu Items -->
                            <div class="py-2 sm:py-3">
                                <button id="profileBtn" class="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-sm sm:text-base font-medium group">
                                    <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 flex-shrink-0">
                                        ${ICONS.user("w-4 h-4")}
                                    </div>
                                    <div class="text-left min-w-0">
                                        <div class="font-semibold text-sm sm:text-base truncate">${t("header_dropdown_profile_title")}</div>
                                        <div class="${TEXT_MUTED} hidden sm:block truncate">${t("header_dropdown_profile_description")}</div>
                                    </div>
                                </button>
                                
                                <button id="profileSettingsBtn" class="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-sm sm:text-base font-medium group">
                                    <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 flex-shrink-0">
                                        ${ICONS.settings("w-4 h-4")}
                                    </div>
                                    <div class="text-left min-w-0">
                                        <div class="font-semibold text-sm sm:text-base truncate">${t("header_dropdown_settings_title")}</div>
                                        <div class="${TEXT_MUTED} hidden sm:block truncate">${t("header_dropdown_settings_description")}</div>
                                    </div>
                                </button>
                                
                                <div class="border-t border-slate-200/70 dark:border-slate-700/60 mt-2 pt-2">
                                    <button id="logoutBtn" class="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm sm:text-base font-medium group">
                                        <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-300 flex-shrink-0">
                                            ${ICONS.logout("w-4 h-4")}
                                        </div>
                                        <div class="text-left min-w-0">
                                            <div class="font-semibold text-sm sm:text-base truncate">${t("header_dropdown_logout_title")}</div>
                                            <div class="text-[10px] sm:text-xs text-red-400 hidden sm:block truncate">${t("header_dropdown_logout_description")}</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="flex items-center gap-2">
                            <button id="headerLoginBtn" class="${BUTTON_PRIMARY}">${t("header_login_button")}</button>
                            <button id="headerSignupBtn" class="${BUTTON_OUTLINE}">${t("header_signup_button")}</button>
                        </div>
                        `}
                    </div>
                </div>
            </nav>
        `;
    }

    protected afterRender(): void {
        this.setupEvents();
        this.adjustLogoPosition(sidebarStateManager.getState().isCollapsed);
    }

    private setupEvents(): void {
        this.cleanupDocumentClickHandler();

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
        // Profil Ayarları tıklanınca
        const profileSettingsBtn = this.querySelector('#profileSettingsBtn');
        profileSettingsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate("/settings");
        });
        const mobileSidebarToggle = this.querySelector('#mobileSidebarToggle');
        mobileSidebarToggle?.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarStateManager.toggleMobile();
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
        
        dropdownMenu?.addEventListener('click', (e) => e.stopPropagation());

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
        
        if (dropdownMenu && dropdownBtn) {
            this.documentClickHandler = () => {
                if (dropdownOpen && dropdownMenu) {
                    dropdownMenu.classList.add('hidden');
                    dropdownOpen = false;
                    if (dropdownArrow) {
                        dropdownArrow.style.transform = 'rotate(0deg)';
                    }
                }
            };
            document.addEventListener('click', this.documentClickHandler);
        }
        
        // Logout button event
        const logoutBtn = this.querySelector('#logoutBtn');
        logoutBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            const success = await logout();
            success ? router.navigate("/") : router.navigate("/error/500");
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
        
        // Initial state için logo pozisyonunu ayarla
        this.adjustLogoPosition(sidebarStateManager.getState().isCollapsed);
    }

    private adjustLogoPosition(isCollapsed: boolean): void {
        const logoSection = this.querySelector('#logoSection');
        if (logoSection) {
            // Sidebar ile aynı yumuşak geçiş - transition zaten render'da eklendi
            // Eski class'ları temizle
            logoSection.classList.remove(
                'md:ml-20',
                'lg:ml-20',
                'md:ml-[17rem]',
                'lg:ml-[17rem]'
            );
            
            if (isCollapsed) {
                // Sidebar kapalı (collapsed) - sidebar genişliği 64px (w-16), margin bırak
                logoSection.classList.add('md:ml-20', 'lg:ml-20');
            } else {
                // Sidebar açık - sidebar genişliği 288px (w-72), margin bırak
                logoSection.classList.add('md:ml-[17rem]', 'lg:ml-[17rem]');
            }
        }
    }

    // Event Handler Methods
    private handleLogoClick(): void {
        // Ana sayfaya yönlendir
        router.navigate("/");
    }

    private setupProfileUpdateListener(): void {
        // Settings sayfasında profil güncellendiğinde Header'ı yeniden render et
        this.profileUpdateHandler = () => {
            this.renderComponent();
            this.afterRender();
        };
        window.addEventListener('user-profile-updated', this.profileUpdateHandler);
    }

    private cleanupProfileUpdateListener(): void {
        if (this.profileUpdateHandler) {
            window.removeEventListener('user-profile-updated', this.profileUpdateHandler);
            this.profileUpdateHandler = null;
        }
    }
}

customElements.define("header-component", Header);
