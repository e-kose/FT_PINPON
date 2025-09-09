
class Navbar extends HTMLElement {
    private activeRoute: string = "dashboard";
    private isCollapsed: boolean = true;

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        this.setupEvents();
    }

    disconnectedCallback(): void {
    }

    private render(): void {
        const width = this.isCollapsed ? 'w-16' : 'w-72';
        const padding = this.isCollapsed ? 'px-2' : 'px-4';
        
        this.innerHTML = `
            <div class="${width} bg-white dark:bg-gray-800 shadow-lg h-screen border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed left-0 top-0 z-40">
                <div class="py-6 ${padding} mt-20">
                    <nav class="space-y-1">
                        <a href="#" data-route="dashboard" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-blue-900 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-semibold transition-all duration-200 border-2 border-blue-200 dark:border-blue-800 shadow-sm" title="Dashboard">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">🏠</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Dashboard</span>
                        </a>
                        <a href="#" data-route="play" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md" title="Play Pong">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">🎮</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Play Pong</span>
                        </a>
                        <a href="#" data-route="tournament" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md" title="Tournament">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">🏆</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Tournament</span>
                        </a>
                        <a href="#" data-route="friends" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md" title="Friends">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">👥</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Friends</span>
                        </a>
                        <a href="#" data-route="chat" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md" title="Chat">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">💬</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Chat</span>
                        </a>
                        <a href="#" data-route="settings" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md" title="Settings">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'}">⚙️</span>
                            <span class="${this.isCollapsed ? 'hidden' : ''}">Settings</span>
                        </a>
                    </nav>
                </div>
            </div>
        `;
    }

    private setupEvents(): void {
        // Sidebar toggle event listener - sadece bir kere ekle
        if (!this.hasAttribute('events-setup')) {
            document.addEventListener('sidebar-toggle', () => {
                this.toggleSidebar();
            });
            this.setAttribute('events-setup', 'true');
        }

        // Navigation links
        const navItems = this.querySelectorAll('[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = (item as HTMLElement).getAttribute('data-route');
                this.handleNavigation(route);
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
        this.isCollapsed = !this.isCollapsed;
        this.updateSidebarUI();
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

    // Event Handler Methods - İçleri boş, sen dolduracaksın
    private handleNavigation(route: string | null): void {
        if (!route) return;
        
        // Aktif durumu güncelle
        this.activeRoute = route;
        this.setActiveNavItem(route);
        
        // Navigation logic buraya eklenecek
        // Router ile yönlendirme yapılabilir
        // router.navigate(`/${route}`);
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

customElements.define("sidebar-component", Navbar);
