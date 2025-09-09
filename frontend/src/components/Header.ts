import { router } from "../router/Router";

interface UserProfile {
    username: string;
    avatar: string;
    status: string;
}

class Header extends HTMLElement {
    private userProfile: UserProfile = {
        username: "Mehmet",
        avatar: "https://via.placeholder.com/32x32/3B82F6/FFFFFF?text=M",
        status: "Online"
    };

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
        this.innerHTML = `
            <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-50">
                <div class="relative flex items-center h-20 px-0">
                        <!-- Left Section with Hamburger -->
                        <div class="flex items-center">
                            <!-- Hamburger Menu - Positioned at absolute left -->
                            <button id="sidebarToggle" class="p-5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                                <svg class="w-8 h-8 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                </svg>
                            </button>
                        </div>
                            
                        <!-- Logo Section - Centered -->
                        <div id="logoSection" class="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                            <img class="w-10 h-10" src="/pong.png" alt="logo">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Ft_Transcendance</h1>
                        </div>
                        
                        <!-- User Section -->
                        <div id="userDropdown" class="ml-auto flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-xl transition-colors mr-8">
                            <img id="userAvatar" class="h-12 w-12 rounded-full border-2 border-blue-900 dark:border-blue-400" src="${this.userProfile.avatar}" alt="Avatar">
                            <div class="flex flex-col">
                                <span id="username" class="text-base font-semibold text-gray-900 dark:text-white">${this.userProfile.username}</span>
                                <span id="userStatus" class="text-sm text-gray-500 dark:text-gray-400">${this.userProfile.status}</span>
                            </div>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    private setupEvents(): void {
        // Sidebar toggle event
        const 	sidebarToggle = this.querySelector('#sidebarToggle');
        sidebarToggle?.addEventListener('click', () => {
            this.handleSidebarToggle();
        });

        // Logo click event - Ana sayfaya yönlendir
        const logoSection = this.querySelector('#logoSection');
        logoSection?.addEventListener('click', () => {
            this.handleLogoClick();
        });

        // User dropdown click event
        const userDropdown = this.querySelector('#userDropdown');
        userDropdown?.addEventListener('click', () => {
            this.handleUserDropdown();
        });
    }

    // Event Handler Methods - İçleri boş, sen dolduracaksın
    private handleSidebarToggle(): void {
        // Sidebar toggle event'ini dispatch et
        const event = new CustomEvent('sidebar-toggle');
        document.dispatchEvent(event);
    }

    private handleLogoClick(): void {
        // Ana sayfaya yönlendir
        router.navigate("/");
    }

    private handleUserDropdown(): void {
        // TODO: User dropdown functionality
    }

    // Update Methods - İçleri boş, sen dolduracaksın
    public updateUserProfile(profile: Partial<UserProfile>): void {
        // Kullanıcı profilini güncelle
        this.userProfile = { ...this.userProfile, ...profile };
        
        // DOM güncellemeleri
        const username = this.querySelector('#username');
        const userAvatar = this.querySelector('#userAvatar') as HTMLImageElement;
        const userStatus = this.querySelector('#userStatus');
        
        if (username && profile.username) {
            username.textContent = profile.username;
        }
        
        if (userAvatar && profile.avatar) {
            userAvatar.src = profile.avatar;
        }
        
        if (userStatus && profile.status) {
            userStatus.textContent = profile.status;
        }
    }

    public setUserStatus(status: string): void {
        // Kullanıcı durumunu güncelle
        this.userProfile.status = status;
        const userStatus = this.querySelector('#userStatus');
        if (userStatus) {
            userStatus.textContent = status;
        }
    }

    // Getter Methods
    public getUserProfile(): UserProfile {
        return { ...this.userProfile };
    }
}

customElements.define("header-component", Header);