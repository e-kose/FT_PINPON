import "./Header";
import "./SideBar";
import "./Statistics";
import "./PlayerList";
import "./LastGames";
import { getUser } from "../store/UserStore";
import { router } from "../router/Router";
import { sidebarStateManager } from "../router/SidebarStateManager";
import type { SidebarStateListener } from "../router/SidebarStateManager";

class Dashboard extends HTMLElement {
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
	private loginedDashboard(): string {
		return (`
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="pt-16 md:pt-20 lg:pt-24">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="dashboard"></sidebar-component>

                    <!-- Main Content -->
                    <div class="ml-16 p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300" id="mainContent" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
                        <!-- Welcome Section -->
                        <div class="mb-6 lg:mb-8 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-4 sm:p-6 lg:p-8 rounded-lg lg:rounded-xl shadow-xl border border-white/20 text-center">
                            <h2 id="welcomeMessage" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 lg:mb-3">
                                👋 Hoş geldin, ${getUser()?.profile?.full_name || getUser()?.username || 'Oyuncu'}!
                            </h2>
                            <p class="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg">Hazır mısın? Hadi oyuna başlayalım!</p>
                        </div>

                        <!-- Quick Actions -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                            <button id="playNowBtn" class="group bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-semibold py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 rounded-lg lg:rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                                <div class="flex items-center justify-center space-x-2 lg:space-x-3">
                                    <span class="text-xl lg:text-2xl">🎮</span>
                                    <div class="text-left">
                                        <div class="text-lg lg:text-xl font-bold">Hızlı Oyun</div>
                                        <div class="text-blue-200 text-xs lg:text-sm">Anında rakip bul</div>
                                    </div>
                                </div>
                            </button>
                            
                            <button id="inviteFriendBtn" class="group bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white font-semibold py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 rounded-lg lg:rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                                <div class="flex items-center justify-center space-x-2 lg:space-x-3">
                                    <span class="text-xl lg:text-2xl">👥</span>
                                    <div class="text-left">
                                        <div class="text-lg lg:text-xl font-bold">Arkadaş Davet Et</div>
                                        <div class="text-green-200 text-xs lg:text-sm">Özel maç oluştur</div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <!-- Stats and Leaderboard Grid - Responsive Layout -->
                        <div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-4 sm:p-6 rounded-lg lg:rounded-xl shadow-xl border border-white/20 mb-6 lg:mb-8">
                            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                                <!-- Statistics Component -->
                                <div class="w-full">
                                    <statistics-component></statistics-component>
                                </div>

                                <!-- Player List Component -->
                                <div class="w-full">
                                    <player-list-component></player-list-component>
                                </div>
                            </div>
                        </div>

                        <!-- Last Games Component -->
                        <div class="bg-white/40 backdrop-blur-sm dark:bg-gray-800/20 p-4 sm:p-6 rounded-lg lg:rounded-xl shadow-xl border border-white/20">
                            <last-games-component></last-games-component>
                        </div>
                    </div>
                </div>
            </div>
        `);
	}
	private loggedOutDashboard(): string {
		return (`
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<!-- Header Component -->
				<header-component></header-component>
				
				<div class="pt-16 md:pt-20 lg:pt-24">
					<!-- Main Content for Not Logged In Users -->
					<div class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))">
						<!-- Hero Section -->
						<div class="max-w-6xl mx-auto text-center mb-8 sm:mb-12 lg:mb-16">
							<div class="mb-6 lg:mb-8 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/20 shadow-xl">
								<!-- Logo ve Ana Başlık -->
								<div class="flex flex-col items-center mb-6 lg:mb-8">
									<div class="flex flex-col sm:flex-row items-center mb-4 lg:mb-6">
										<img class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-0 sm:mr-4 lg:mr-6 drop-shadow-2xl" src="/pong.png" alt="Ft_Transcendance Logo">
										<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white drop-shadow-2xl tracking-wide text-center sm:text-left">
											Ft_Transcendance
										</h1>
									</div>
									<h2 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300 mb-4 lg:mb-6 drop-shadow-lg">
										🎮 Hoş Geldiniz
									</h2>
								</div>
								<p class="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
									En eski ve en sevilen oyunlardan biri olan Pong'u modern bir yaklaşımla yeniden keşfedin. 
									Arkadaşlarınızla oynayın, turnuvalara katılın ve liderlik tablosunda zirvede yer alın!
								</p>
							</div>
						</div>

						<!-- Features Grid -->
						<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🎮</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">Gerçek Zamanlı Oyun</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">Arkadaşlarınızla veya rastgele rakiplerle gerçek zamanlı Pong oyunu oynayın.</p>
							</div>
							
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">🏆</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">Turnuvalar</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">Düzenli turnuvalara katılın ve şampiyonluk için mücadele edin.</p>
							</div>
							
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
								<div class="text-4xl mb-4">👥</div>
								<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">Sosyal Özellikler</h3>
								<p class="text-gray-600 dark:text-gray-300 drop-shadow-sm">Arkadaş ekleyin, sohbet edin ve istatistiklerinizi paylaşın.</p>
							</div>
						</div>

						<!-- Call to Action -->
						<div class="max-w-4xl mx-auto bg-blue-900/90 backdrop-blur-sm dark:bg-blue-800/90 p-12 rounded-xl text-center shadow-xl border border-blue-400/40 mb-16">
							<h2 class="text-3xl font-bold text-white mb-6 drop-shadow-md">Oyuna Başlamaya Hazır mısın?</h2>
							<p class="text-blue-100 text-lg mb-8 drop-shadow-sm">Hemen kayıt ol ve Pong dünyasının bir parçası olun!</p>
							<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
								<button id="ctaSignupBtn" class="bg-white/95 backdrop-blur-sm text-blue-900 font-bold py-4 px-8 rounded-lg hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
									Kayıt Ol
								</button>
								<button id="ctaLoginBtn" class="border-2 border-white/90 bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
									Giriş Yap
								</button>
							</div>
						</div>

						<!-- Additional Info -->
						<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
								<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center drop-shadow-md">
									<span class="text-3xl mr-3">🏓</span>
									Pong Deneyimi
								</h3>
								<div class="space-y-4">
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">⚡</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Hızlı ve akıcı oyun deneyimi</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">🎯</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Hassas kontroller</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">👥</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Çoklu oyuncu desteği</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">🏆</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Turnuva sistemi</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">📊</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Detaylı istatistikler</span>
									</div>
								</div>
							</div>
							
							<div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-8 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl hover:transform hover:scale-105 transition-all duration-300">
								<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center drop-shadow-md">
									<span class="text-3xl mr-3">👥</span>
									Sosyal Özellikler
								</h3>
								<div class="space-y-4">
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">💬</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Canlı sohbet sistemi</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">🤝</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Arkadaş sistemi</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">🎮</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Özel maçlar</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">🏅</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Başarım rozetleri</span>
									</div>
									<div class="flex items-center p-3 rounded-lg hover:bg-white/30 transition-colors">
										<span class="mr-3 text-2xl">📈</span>
										<span class="text-gray-600 dark:text-gray-300 font-medium drop-shadow-sm">Skor takibi</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`);
	}
	private render(): void {
		
		if (getUser()) {
			this.innerHTML = this.loginedDashboard();
		} else {
			setTimeout(() =>{
				this.innerHTML = this.loggedOutDashboard();
			}, 100)
		}
	}
	private setupEvents(): void {
        // Action buttons for logged in users
        const playNowBtn = this.querySelector('#playNowBtn');
        const inviteFriendBtn = this.querySelector('#inviteFriendBtn');

        playNowBtn?.addEventListener('click', () => {
            this.handlePlayNow();
        });

        inviteFriendBtn?.addEventListener('click', () => {
            this.handleInviteFriend();
        });

        // CTA buttons for not logged in users
        const ctaSignupBtn = this.querySelector('#ctaSignupBtn');
        const ctaLoginBtn = this.querySelector('#ctaLoginBtn');

        ctaSignupBtn?.addEventListener('click', () => {
            this.handleCtaSignup();
        });

        ctaLoginBtn?.addEventListener('click', () => {
            this.handleCtaLogin();
        });
    }

    private setupSidebarListener(): void {
        // State manager'dan sidebar durumunu dinle
        this.sidebarListener = (state) => {
            this.adjustMainContentMargin(state.isCollapsed);
        };
        
        sidebarStateManager.addListener(this.sidebarListener);
    }

    private adjustMainContentMargin(isCollapsed: boolean): void {
        const mainContent = this.querySelector('#mainContent');
        if (mainContent) {
            // Transition sınıflarını ekle
            const transitionClasses = sidebarStateManager.getTransitionClasses();
            mainContent.classList.add(...transitionClasses);
            
            if (isCollapsed) {
                // Sidebar kapalı - margin'i azalt
                mainContent.classList.remove('ml-72');
                mainContent.classList.add('ml-16');
            } else {
                // Sidebar açık - margin'i artır
                mainContent.classList.remove('ml-16');
                mainContent.classList.add('ml-72');
            }
        }
    }

    private handlePlayNow(): void {
        // TODO: Navigate to game page
    }

    private handleInviteFriend(): void {
        // TODO: Open friend invitation modal
    }

    private handleCtaSignup(): void {
        router.navigate('/signup');
    }

    private handleCtaLogin(): void {
        router.navigate('/login');
    }
}

customElements.define("dashboard-component", Dashboard);
