import "./Header";
import "./SideBar";
import "./Statistics";
import "./PlayerList";
import "./LastGames";

class Dashboard extends HTMLElement {

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
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="pt-20">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="dashboard"></sidebar-component>

                    <!-- Main Content -->
                    <div class="ml-16 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-auto transition-all duration-300" id="mainContent">
                        <!-- Welcome Section -->
                        <div class="mb-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
                            <h2 id="welcomeMessage" class="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                                👋 Hoş geldin, Mehmet!
                            </h2>
                            <p class="text-gray-600 dark:text-gray-400 text-lg">Hazır mısın? Hadi oyuna başlayalım!</p>
                        </div>

                        <!-- Quick Actions -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <button id="playNowBtn" class="group bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">🎮</span>
                                    <div class="text-left">
                                        <div class="text-xl font-bold">Hızlı Oyun</div>
                                        <div class="text-blue-200 text-sm">Anında rakip bul</div>
                                    </div>
                                </div>
                            </button>
                            
                            <button id="inviteFriendBtn" class="group bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white font-semibold py-6 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">👥</span>
                                    <div class="text-left">
                                        <div class="text-xl font-bold">Arkadaş Davet Et</div>
                                        <div class="text-green-200 text-sm">Özel maç oluştur</div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <!-- Stats and Leaderboard Grid - 50/50 Layout -->
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Statistics Component -->
                                <statistics-component></statistics-component>

                                <!-- Player List Component -->
                                <player-list-component></player-list-component>
                            </div>
                        </div>

                        <!-- Last Games Component -->
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <last-games-component></last-games-component>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }



    private setupEvents(): void {
        // Sidebar toggle listener
        document.addEventListener('sidebar-toggle', () => {
            this.handleSidebarToggle();
        });

        // Action buttons
        const playNowBtn = this.querySelector('#playNowBtn');
        const inviteFriendBtn = this.querySelector('#inviteFriendBtn');

        playNowBtn?.addEventListener('click', () => {
            this.handlePlayNow();
        });

        inviteFriendBtn?.addEventListener('click', () => {
            this.handleInviteFriend();
        });
    }

    private handleSidebarToggle(): void {
        const mainContent = this.querySelector('#mainContent');
        if (mainContent) {
            // Sidebar durumuna göre main content margin'ini ayarla
            if (mainContent.classList.contains('ml-16')) {
                mainContent.classList.remove('ml-16');
                mainContent.classList.add('ml-72');
            } else {
                mainContent.classList.remove('ml-72');
                mainContent.classList.add('ml-16');
            }
        }
    }

    private handlePlayNow(): void {
        // TODO: Navigate to game page
    }

    private handleInviteFriend(): void {
        // TODO: Open friend invitation modal
    }
}

customElements.define("dashboard-component", Dashboard);