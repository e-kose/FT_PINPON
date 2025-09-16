import { router } from "../router/Router";
import { sidebarStateManager } from "../router/SidebarStateManager";

class SideBar extends HTMLElement {
    private activeRoute: string = "dashboard";
    private isCollapsed: boolean = true;

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
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
            case "/dashboard":
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
            <div class="${width} bg-white dark:bg-gray-800 shadow-lg h-screen border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed left-0 top-0 z-60">
                <!-- Hamburger Toggle Button - En Üstte -->
                <div class="flex ${this.isCollapsed ? 'justify-center' : 'justify-end'} p-4 border-b border-gray-200 dark:border-gray-700">
                    <button id="hamburgerToggle" class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center rounded-lg hover:shadow-lg">
                        <svg class="w-6 h-6 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${this.isCollapsed ? '' : 'rotate-90'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Navigation Content -->
                <div class="py-6 ${padding}">
                    <nav class="space-y-1">
                        <a href="/" data-route="dashboard" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('dashboard')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Ana Sayfa">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">🏠</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Ana Sayfa</span>
                        </a>
                        <a href="/play" data-route="play" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('play')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Oyun Oyna">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">🎮</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Oyun Oyna</span>
                        </a>
                        <a href="/tournament" data-route="tournament" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('tournament')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Turnuva">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">🏆</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Turnuva</span>
                        </a>
                        <a href="/friends" data-route="friends" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('friends')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Arkadaşlar">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">👥</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Arkadaşlar</span>
                        </a>
                        <a href="/chat" data-route="chat" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('chat')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Sohbet">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">💬</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Sohbet</span>
                        </a>
                        <a href="/settings" data-route="settings" class="nav-item flex items-center ${this.isCollapsed ? 'justify-center px-2' : 'px-4'} py-4 mb-2 ${this.getNavItemClasses('settings')} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md" title="Ayarlar">
                            <span class="text-2xl ${this.isCollapsed ? '' : 'mr-4'} transition-all duration-300">⚙️</span>
                            <span class="nav-text ${this.isCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'} transition-all duration-300 ease-out">Ayarlar</span>
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
        // Hamburger toggle button
        const hamburgerBtn = this.querySelector('#hamburgerToggle');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
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
            // Remove active classes
            item.classList.remove(
                'text-blue-900', 'bg-blue-50', 'dark:bg-blue-900/20', 
                'dark:text-blue-400', 'font-semibold', 'border-blue-200', 'dark:border-blue-800'
            );
            // Add inactive classes
            item.classList.add(
                'text-gray-700', 'dark:text-gray-300', 'font-medium', 
                'border-gray-200', 'dark:border-gray-600',
                'hover:bg-gray-100', 'dark:hover:bg-gray-700', 
                'hover:border-gray-300', 'dark:hover:border-gray-500'
            );
        });

        // Aktif route'u ayarla
        const activeNavItem = this.querySelector(`[data-route="${route}"]`);
        if (activeNavItem) {
            // Remove inactive classes
            activeNavItem.classList.remove(
                'text-gray-700', 'dark:text-gray-300', 'font-medium', 
                'border-gray-200', 'dark:border-gray-600',
                'hover:bg-gray-100', 'dark:hover:bg-gray-700', 
                'hover:border-gray-300', 'dark:hover:border-gray-500'
            );
            // Add active classes
            activeNavItem.classList.add(
                'text-blue-900', 'bg-blue-50', 'dark:bg-blue-900/20', 
                'dark:text-blue-400', 'font-semibold', 'border-blue-200', 'dark:border-blue-800'
            );
        }
    }

    private handleNavigation(route: string | null): void {
        if (!route) return;
        
        this.activeRoute = route;
        this.setActiveNavItem(route);
        
        let path = '';
        switch(route) {
            case 'dashboard':
                path = '/';
                break;
            case 'play':
                path = '/play';
                break;
            case 'tournament':
                path = '/tournament';
                break;
            case 'friends':
                path = '/friends';
                break;
            case 'chat':
                path = '/chat';
                break;
            case 'settings':
                path = '/settings';
                break;
            default:
                path = '/';
        }
        
        router.navigate(path);
    }

    // Sidebar Toggle Method
    private toggleSidebar(): void {
        this.isCollapsed = !this.isCollapsed;
        
        // State manager'ı güncelle - bu tüm dinleyicileri otomatik bilgilendirecek
        sidebarStateManager.updateState(this.isCollapsed);
        
        this.updateSidebarLayout();
    }

    private updateSidebarLayout(): void {
        const container = this.querySelector('div');
        const textElements = this.querySelectorAll('.nav-text');
        const iconElements = this.querySelectorAll('.nav-item span:first-child');
        const navItems = this.querySelectorAll('.nav-item');
        const hamburgerContainer = this.querySelector('div:first-child > div');
        const hamburgerIcon = this.querySelector('#hamburgerToggle svg');
        
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

        // Update hamburger button position and icon rotation
        if (hamburgerContainer) {
            if (this.isCollapsed) {
                hamburgerContainer.classList.remove('justify-end');
                hamburgerContainer.classList.add('justify-center');
            } else {
                hamburgerContainer.classList.remove('justify-center');
                hamburgerContainer.classList.add('justify-end');
            }
        }

        // Hamburger icon rotation
        if (hamburgerIcon) {
            if (this.isCollapsed) {
                hamburgerIcon.classList.remove('rotate-90');
            } else {
                hamburgerIcon.classList.add('rotate-90');
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

        // Smooth text animations with staggered timing
        textElements.forEach((text, index) => {
            if (this.isCollapsed) {
                // Closing animation - hide text first
                setTimeout(() => {
                    text.classList.remove('opacity-100', 'scale-100');
                    text.classList.add('opacity-0', 'scale-0', 'w-0', 'overflow-hidden');
                }, index * 20); // Stagger by 20ms
            } else {
                // Opening animation - show text with delay
                setTimeout(() => {
                    text.classList.remove('opacity-0', 'scale-0', 'w-0', 'overflow-hidden');
                    text.classList.add('opacity-100', 'scale-100');
                }, 200 + (index * 30)); // Start after container animation + stagger
            }
        });

        // Icon margin animations
        iconElements.forEach((icon, index) => {
            setTimeout(() => {
                if (this.isCollapsed) {
                    icon.classList.remove('mr-4');
                } else {
                    icon.classList.add('mr-4');
                }
            }, index * 15); // Slight stagger for icons
        });
    }

}

customElements.define('sidebar-component', SideBar);
export { SideBar };
