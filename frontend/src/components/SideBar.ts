
import { router } from "../router/Router";

class SideBar extends HTMLElement {
    private activeRoute: string = "dashboard";
    private isCollapsed: boolean = true;

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        // Get current route from URL automatically
        this.updateActiveRouteFromURL();
        this.setupEvents();
    }

    disconnectedCallback(): void {
    }

    private updateActiveRouteFromURL(): void {
        const currentPath = window.location.pathname;
        let route = "dashboard";
        
        switch(currentPath) {
            case "/":
                route = "dashboard";
                break;
            case "/play":
                route = "play";
                break;
            case "/tournament":
                route = "tournament";
                break;
            case "/friends":
                route = "friends";
                break;
            case "/chat":
                route = "chat";
                break;
            case "/settings":
                route = "settings";
                break;
            default:
                route = "dashboard";
        }
        
        this.activeRoute = route;
    }

    private render(): void {
        const width = this.isCollapsed ? 'w-16' : 'w-72';
        const padding = this.isCollapsed ? 'px-2' : 'px-4';
        
        this.innerHTML = `
            <!-- Mobile Overlay -->
            <div class="lg:hidden ${this.isCollapsed ? 'hidden' : ''} fixed inset-0 bg-black bg-opacity-50 z-40" id="sidebar-overlay"></div>
            
            <!-- Sidebar -->
            <div class="${width} bg-white dark:bg-gray-800 shadow-lg h-screen border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed left-0 top-0 z-50 lg:z-40 ${this.isCollapsed ? 'lg:flex hidden' : 'flex'} flex-col">
                <!-- Mobile Close Button -->
                <div class="lg:hidden flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
                    <button id="sidebar-close" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Navigation Content -->
                <div class="flex-1 py-4 lg:py-6 ${padding} mt-12 lg:mt-16 xl:mt-20 overflow-y-auto">
                    <nav class="space-y-1">
                        <a href="/" data-route="dashboard" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('dashboard')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Ana Sayfa">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">🏠</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Ana Sayfa</span>
                        </a>
                        <a href="/play" data-route="play" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('play')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Oyun Oyna">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">🎮</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Oyun Oyna</span>
                        </a>
                        <a href="/tournament" data-route="tournament" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('tournament')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Turnuva">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">🏆</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Turnuva</span>
                        </a>
                        <a href="/friends" data-route="friends" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('friends')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Arkadaşlar">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">👥</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Arkadaşlar</span>
                        </a>
                        <a href="/chat" data-route="chat" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('chat')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Sohbet">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">💬</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Sohbet</span>
                        </a>
                        <a href="/settings" data-route="settings" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-3 lg:py-4 mb-2 ${this.getNavItemClasses('settings')} rounded-lg lg:rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Ayarlar">
                            <span class="text-xl lg:text-2xl ${this.isCollapsed ? '' : 'mr-3 lg:mr-4'}">⚙️</span>
                            <span class="${this.isCollapsed ? 'hidden' : 'text-sm lg:text-base'}">Ayarlar</span>
                        </a>
                    </nav>
                </div>
            </div>
        `;
    }

    private getNavItemClasses(route: string): string {
        if (this.activeRoute === route) {
            return 'text-blue-900 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 font-semibold border-blue-200 dark:border-blue-800';
        } else {
            return 'text-gray-700 dark:text-gray-300 font-medium border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500';
        }
    }

    private setupEvents(): void {
        // Sidebar toggle event listener - sadece bir kere ekle
        if (!this.hasAttribute('events-setup')) {
            document.addEventListener('sidebar-toggle', () => {
                this.toggleSidebar();
            });
            this.setAttribute('events-setup', 'true');
        }

        // Mobile overlay click to close
        const overlay = this.querySelector('#sidebar-overlay');
        overlay?.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // Mobile close button
        const closeBtn = this.querySelector('#sidebar-close');
        closeBtn?.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // Navigation links
        const navItems = this.querySelectorAll('[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = (item as HTMLElement).getAttribute('data-route');
                this.handleNavigation(route);
                
                // Mobile'da navigation sonrası sidebar'ı kapat
                if (window.innerWidth < 1024) {
                    this.closeMobileSidebar();
                }
            });
        });
    }

    private setActiveNavItem(route: string): void {
        // Tüm nav item'ları temizle
        const navItems = this.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('text-blue-900', 'bg-blue-50', 'dark:bg-blue-900/20', 'dark:text-blue-400', 'font-semibold', 'border-blue-200', 'dark:border-blue-800');
            item.classList.add('text-gray-700', 'dark:text-gray-300', 'font-medium', 'border-gray-200', 'dark:border-gray-600');
        });

        // Aktif item'ı ayarla
        const activeItem = this.querySelector(`[data-route="${route}"]`);
        if (activeItem) {
            activeItem.classList.remove('text-gray-700', 'dark:text-gray-300', 'font-medium', 'border-gray-200', 'dark:border-gray-600');
            activeItem.classList.add('text-blue-900', 'bg-blue-50', 'dark:bg-blue-900/20', 'dark:text-blue-400', 'font-semibold', 'border-blue-200', 'dark:border-blue-800');
        }
    }

    // Sidebar Toggle Method
    private toggleSidebar(): void {
        // Mobile ve desktop'ta farklı davranışlar
        if (window.innerWidth < 1024) {
            // Mobile: overlay olarak aç/kapat
            this.isCollapsed = !this.isCollapsed;
            this.render();
            this.setupEvents();
        } else {
            // Desktop: genişlik toggle
            this.isCollapsed = !this.isCollapsed;
            this.updateSidebarUI();
        }
    }

    private closeMobileSidebar(): void {
        if (window.innerWidth < 1024) {
            this.isCollapsed = true;
            this.render();
            this.setupEvents();
        }
    }

    private updateSidebarUI(): void {
        const container = this.querySelector('div');
        const textElements = this.querySelectorAll('.nav-item span:last-child');
        const iconElements = this.querySelectorAll('.nav-item span:first-child');
        const navItems = this.querySelectorAll('.nav-item');
        
        if (container) {
            if (this.isCollapsed) {
                container.classList.remove('w-72');
                container.classList.add('w-16');
                container.querySelector('.py-6')?.classList.replace('px-4', 'px-2');
            } else {
                container.classList.remove('w-16');
                container.classList.add('w-72');
                container.querySelector('.py-6')?.classList.replace('px-2', 'px-4');
            }
        }

        // Toggle nav item layout
        navItems.forEach(item => {
            if (this.isCollapsed) {
                item.classList.add('justify-center');
                item.classList.remove('px-4');
                item.classList.add('px-2');
            } else {
                item.classList.remove('justify-center');
                item.classList.remove('px-2');
                item.classList.add('px-4');
            }
        });

        // Toggle text visibility
        textElements.forEach(text => {
            if (this.isCollapsed) {
                text.classList.add('hidden');
            } else {
                text.classList.remove('hidden');
            }
        });

        // Toggle icon margins
        iconElements.forEach(icon => {
            if (this.isCollapsed) {
                icon.classList.remove('mr-4');
            } else {
                icon.classList.add('mr-4');
            }
        });
    }

    // Event Handler Methods - Router ile navigasyon
    private handleNavigation(route: string | null): void {
        if (!route) return;
        
        // Aktif durumu güncelle
        this.activeRoute = route;
        this.setActiveNavItem(route);
        
        // Router ile yönlendirme yap
        const routePath = route === 'dashboard' ? '/' : `/${route}`;
        router.navigate(routePath);
    }

    // Public Methods - İçleri boş, sen dolduracaksın
    public setActiveRoute(route: string): void {
        // Dışarıdan aktif route ayarlama
        this.activeRoute = route;
        this.setActiveNavItem(route);
    }

    public getActiveRoute(): string {
        // Aktif route'u döndür
        return this.activeRoute;
    }

    public navigateToRoute(route: string): void {
        // Programmatik navigasyon
        this.handleNavigation(route);
    }

    // Navigation Methods - İçleri boş, sen dolduracaksın
    public navigateToDashboard(): void {
        this.handleNavigation("dashboard");
    }

    public navigateToPlay(): void {
        this.handleNavigation("play");
    }

    public navigateToTournament(): void {
        this.handleNavigation("tournament");
    }

    public navigateToFriends(): void {
        this.handleNavigation("friends");
    }

    public navigateToChat(): void {
        this.handleNavigation("chat");
    }

    public navigateToSettings(): void {
        this.handleNavigation("settings");
    }

    // Utility Methods
    public highlightRoute(route: string): void {
        // Belirtilen route'u vurgula
        this.setActiveNavItem(route);
    }

    public resetNavigation(): void {
        // Navigasyonu sıfırla
        this.setActiveRoute("dashboard");
    }
}

customElements.define("sidebar-component", SideBar);
