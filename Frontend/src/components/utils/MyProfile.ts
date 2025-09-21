import "./Header";
import "./SideBar";
import { getUser } from "../../store/UserStore";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";

class MyProfile extends HTMLElement {
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

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.updateMainContentMargin(state.isCollapsed);
		};
		sidebarStateManager.addListener(this.sidebarListener);
	}

	private updateMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector('.main-content');
		if (mainContent) {
			if (isCollapsed) {
				mainContent.classList.remove('ml-72');
				mainContent.classList.add('ml-16');
			} else {
				mainContent.classList.remove('ml-16');
				mainContent.classList.add('ml-72');
			}
		}
	}

	private setupEvents(): void {
		// Edit profile button
		this.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.closest('.edit-profile-btn')) {
				this.toggleEditMode();
			}

			// Save profile changes
			if (target.closest('.save-profile-btn')) {
				this.saveProfile();
			}

			// Cancel edit mode
			if (target.closest('.cancel-edit-btn')) {
				this.render(); // Re-render to reset changes
			}
		});

		// Navigate to 2FA management page
		this.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.closest('[data-goto-2fa]')) {
				// simple navigate using router if available
				(window as any).router ? (window as any).router.navigate('/2fa') : window.location.pathname = '/2fa';
			}
		});
	}

	private toggleEditMode(): void {
		const profileContent = this.querySelector('.profile-content');
		const user = getUser();

		if (!user || !profileContent) return;

		profileContent.innerHTML = `
            <div class="space-y-8">
                <!-- Avatar Section -->
                <div class="flex flex-col items-center space-y-6">
                    <div class="relative">
                        <img 
                            src="${user.profile?.avatar_url || '/Avatar/1.png'}" 
                            alt="Profil Resmi" 
                            class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-blue-200/50"
                        >
                        <button class="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Profili Düzenle</h2>
                </div>

                <!-- Edit Form -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ad Soyad</label>
                            <input 
                                type="text" 
                                id="editFullName"
                                value="${user.profile?.full_name || ''}"
                                class="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg"
                                placeholder="Ad ve soyadınızı girin"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Kullanıcı Adı</label>
                            <input 
                                type="text" 
                                id="editUsername"
                                value="${user.username}"
                                class="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg"
                                placeholder="Kullanıcı adınızı girin"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">E-mail</label>
                            <input 
                                type="email" 
                                id="editEmail"
                                value="${user.email}"
                                class="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg"
                                placeholder="E-mail adresinizi girin"
                            >
                        </div>
                        
                                                <!-- 2FA Management Redirect -->
                                                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200/50 dark:border-blue-700/50">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center space-x-4">
                                                            <div class="w-12 h-12 bg-gradient-to-r ${user.is_2fa_enabled ? 'from-green-500 to-emerald-600' : 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center transition-all duration-300">
                                                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h4 class="text-lg font-semibold text-gray-900 dark:text-white">İki Faktörlü Doğrulama (2FA)</h4>
                                                                <p class="text-sm text-gray-600 dark:text-gray-400">Durum: <span class="font-semibold ${user.is_2fa_enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${user.is_2fa_enabled ? 'Aktif' : 'Pasif'}</span></p>
                                                            </div>
                                                        </div>
                                                        <button type="button" data-goto-2fa class="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium shadow transition">Yönet</button>
                                                    </div>
                                                </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Hakkımda</label>
                        <textarea 
                            id="editBio"
                            rows="10"
                            class="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-300 text-lg"
                            placeholder="Kendiniz hakkında birkaç kelime yazın..."
                        >${user.profile?.bio || ''}</textarea>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200 dark:border-gray-600">
                    <button class="save-profile-btn flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        <span class="flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Değişiklikleri Kaydet</span>
                        </span>
                    </button>
                    <button class="cancel-edit-btn flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        <span class="flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span>İptal Et</span>
                        </span>
                    </button>
                </div>
            </div>
        `;
	}

	private saveProfile(): void {
		const fullName = (this.querySelector('#editFullName') as HTMLInputElement)?.value;
		const username = (this.querySelector('#editUsername') as HTMLInputElement)?.value;
		const email = (this.querySelector('#editEmail') as HTMLInputElement)?.value;
		const bio = (this.querySelector('#editBio') as HTMLTextAreaElement)?.value;

		// Here you would typically make an API call to save the profile
		console.log('Saving profile:', { fullName, username, email, bio });

		// For now, just show a success message and re-render
		this.showSuccessMessage();
		setTimeout(() => {
			this.render();
		}, 2000);
	}

	private showSuccessMessage(): void {
		const content = this.querySelector('.profile-content');
		if (content) {
			content.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Profil Başarıyla Güncellendi! 🎉</h3>
                    <p class="text-xl text-gray-600 dark:text-gray-400 mb-6">Değişiklikleriniz kaydedildi ve profiliniz güncellendi.</p>
                    <div class="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto rounded-full"></div>
                </div>
            `;
		}
	}


	private formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	private render(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
                <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oturum Açmalısınız</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">Profilinizi görüntülemek için önce giriş yapın.</p>
                        <button onclick="router.navigate('/login')" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg">
                            Giriş Yap
                        </button>
                    </div>
                </div>
            `;
			return;
		}

		// Sidebar durumunu al ve doğru margin class'ını belirle
		const sidebarState = sidebarStateManager.getState();
		const marginClass = sidebarState.isCollapsed ? 'ml-16' : 'ml-72';

		this.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="pt-16 md:pt-20 lg:pt-24">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="profile"></sidebar-component>

                    <!-- Main Content -->
                    <div class="main-content ${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
                        <div class="w-full">
                            <!-- Profile Header -->
                            <div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 overflow-hidden mb-6">
                                <div class="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-black p-8 text-white relative overflow-hidden">
                                    <!-- Background Pattern -->
                                    <div class="absolute inset-0 opacity-10">
                                        <div class="absolute top-4 right-4 text-6xl">🏓</div>
                                        <div class="absolute bottom-4 left-4 text-4xl">🎮</div>
                                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">🏆</div>
                                    </div>
                                    
                                    <div class="relative z-10 flex flex-col lg:flex-row items-center lg:items-end space-y-6 lg:space-y-0 lg:space-x-8">
                                        <div class="relative">
                                            <img 
                                                src="${user.profile?.avatar_url}" 
                                                alt="Profil Resmi" 
                                                class="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/30 shadow-2xl ring-4 ring-white/20"
                                            >
                                            <div class="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                                                <div class="w-3 h-3 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="text-center lg:text-left flex-1">
                                            <h1 class="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                                ${user.profile?.full_name || user.username}
                                            </h1>
                                            <p class="text-gray-300 text-xl mb-4">@${user.username}</p>
                                            
                                            <!-- Security Status in Header -->
                                            <div class="flex flex-wrap justify-center lg:justify-start gap-3">
                                                <div class="bg-gradient-to-r ${user.is_2fa_enabled ? 'from-green-500/20 to-emerald-500/20' : 'from-yellow-500/20 to-orange-500/20'} backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20">
                                                    <div class="flex items-center space-x-2">
                                                        <div class="w-2 h-2 rounded-full ${user.is_2fa_enabled ? 'bg-green-400' : 'bg-yellow-400'}"></div>
                                                        <span>${user.is_2fa_enabled ? 'İki faktörlü doğrulama aktif' : 'İki faktörlü doğrulama pasif'}</span>
                                                    </div>
                                                </div>
                                                ${!user.is_2fa_enabled ? `<div class="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20"><span class="text-yellow-200">⚠️ 2FA'yı etkinleştirin</span></div>` : ''}
                                            </div>
                                        </div>
                                        
                                        <button class="edit-profile-btn bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl">
                                            <span class="flex items-center space-x-2">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                                <span>Profili Düzenle</span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Profile Content -->
                            <div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 p-8">
                                <div class="profile-content">
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                        <!-- Personal Information -->
                                        <div class="lg:col-span-2 space-y-6">
                                            <div class="flex items-center space-x-3 mb-6">
                                                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                    </svg>
                                                </div>
                                                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Kişisel Bilgiler</h3>
                                            </div>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Ad Soyad</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${user.profile?.full_name || 'Belirtilmemiş'}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Kullanıcı Adı</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">@${user.username}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">E-mail</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${user.email}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Üyelik Tarihi</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${this.formatDate(user.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Bio -->
                                        <div class="space-y-6">
                                            <div class="flex items-center space-x-3 mb-6">
                                                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                </div>
                                                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Hakkımda</h3>
                                            </div>
                                            
                                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 min-h-[200px] hover:shadow-lg transition-all duration-300">
                                                <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg ${!user.profile?.bio ? 'text-gray-500 italic' : ''}">
                                                    ${user.profile?.bio || 'Henüz bir bio yazısı eklenmemiş. Profilinizi düzenleyerek kendiniz hakkında bilgi ekleyebilirsiniz.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quick Stats -->
                                    <div class="border-t border-gray-200/50 dark:border-gray-600/50 pt-8">
                                        <div class="flex items-center space-x-3 mb-6">
                                            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                                </svg>
                                            </div>
                                            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Oyun İstatistikleri</h3>
                                        </div>
                                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl text-center border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
                                                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                                    </svg>
                                                </div>
                                                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">0</div>
                                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Oyun</div>
                                            </div>
                                            <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl text-center border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-300">
                                                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                </div>
                                                <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">0</div>
                                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Galibiyetler</div>
                                            </div>
                                            <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl text-center border border-red-200/50 dark:border-red-700/50 hover:shadow-lg transition-all duration-300">
                                                <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </div>
                                                <div class="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">0</div>
                                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Yenilgiler</div>
                                            </div>
                                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl text-center border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
                                                <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                                                    </svg>
                                                </div>
                                                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">-</div>
                                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Sıralama</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
	}
}

customElements.define('my-profile', MyProfile);

export default MyProfile;
