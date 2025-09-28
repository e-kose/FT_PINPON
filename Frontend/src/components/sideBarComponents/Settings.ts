import "../utils/Header"
import "../utils/SideBar";
import { getUser } from "../../store/UserStore";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";

class SettingsComponent extends HTMLElement {
	private sidebarListener: SidebarStateListener | null = null;
	private currentTab: string = 'profile';

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
		// Tab switching
		this.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			const tabButton = target.closest('[data-tab]');
			
			if (tabButton) {
				const tabName = tabButton.getAttribute('data-tab');
				if (tabName) {
					this.switchTab(tabName);
				}
			}

			// Profile settings save
			if (target.closest('.save-profile-btn')) {
				this.saveProfileSettings();
			}

			// Password change save
			if (target.closest('.save-password-btn')) {
				this.changePassword();
			}

			// 2FA toggle
			if (target.closest('.toggle-2fa-btn')) {
				this.toggle2FA();
			}

			// Theme change
			if (target.closest('[data-theme]')) {
				const theme = target.getAttribute('data-theme');
				if (theme) {
					this.changeTheme(theme);
				}
			}

			// Delete account
			if (target.closest('.delete-account-btn')) {
				this.showDeleteAccountModal();
			}

			// Confirm delete account
			if (target.closest('.confirm-delete-btn')) {
				this.deleteAccount();
			}

			// Cancel delete account
			if (target.closest('.cancel-delete-btn')) {
				this.hideDeleteAccountModal();
			}

			// Avatar upload
			if (target.closest('.upload-avatar-btn')) {
				this.uploadAvatar();
			}
		});

		// Form submission prevention
		this.addEventListener('submit', (e) => {
			e.preventDefault();
		});
	}

	private switchTab(tabName: string): void {
		this.currentTab = tabName;
		this.renderTabContent();
		this.updateTabItemStyles();
	}

	private getTabItemClasses(tab: string): string {
		const base = 'settings-tab-item flex items-center w-full transition-all duration-200 border-2 rounded-xl px-4 py-3 text-sm font-medium shadow-sm hover:shadow-md';
		if (this.currentTab === tab) {
			return base + ' text-blue-900 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
		}
		return base + ' text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500';
	}

	private updateTabItemStyles(): void {
		this.querySelectorAll('[data-tab]').forEach(el => {
			const tab = el.getAttribute('data-tab');
			if (!tab) return;
			el.className = this.getTabItemClasses(tab);
			// Icon spacing like main sidebar
			const icon = el.querySelector('svg');
			if (icon) icon.classList.add('mr-3');
		});
	}

	private saveProfileSettings(): void {
		// Profil ayarlarını kaydetme işlevi
		console.log('Saving profile settings...');
	}

	private changePassword(): void {
		// Şifre değiştirme işlevi
		console.log('Changing password...');
	}

	private toggle2FA(): void {
		// 2FA açma/kapama işlevi
		console.log('Toggling 2FA...');
	}

	private changeTheme(theme: string): void {
		// Tema değiştirme işlevi
		console.log('Changing theme to:', theme);
	}

	private showDeleteAccountModal(): void {
		// Hesap silme modalını gösterme işlevi
		const modal = this.querySelector('.delete-modal');
		if (modal) {
			modal.classList.remove('hidden');
		}
	}

	private hideDeleteAccountModal(): void {
		// Hesap silme modalını gizleme işlevi
		const modal = this.querySelector('.delete-modal');
		if (modal) {
			modal.classList.add('hidden');
		}
	}

	private deleteAccount(): void {
		// Hesap silme işlevi
		console.log('Deleting account...');
	}

	private uploadAvatar(): void {
		// Avatar yükleme işlevi
		console.log('Uploading avatar...');
	}

	private renderTabContent(): void {
		const tabContent = this.querySelector('.tab-content');
		const user = getUser();

		if (!tabContent || !user) return;

		let content = '';

			switch (this.currentTab) {
				case 'profile':
					content = this.getProfileTabContent(user);
					break;
				case 'security':
					content = this.getSecurityTabContent(user);
					break;
				case 'appearance':
					content = this.getAppearanceTabContent(user);
					break;
				case 'account':
					content = this.getAccountTabContent(user);
					break;
				default:
					content = this.getProfileTabContent(user);
			}

		tabContent.innerHTML = content;
	}

	private getProfileTabContent(user: any): string {
		return `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Profil Ayarları</h2>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Avatar Section -->
					<div class="lg:col-span-2">
						<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Fotoğrafı</h3>
							<div class="flex items-center space-x-6">
								<img 
									src="${user.profile?.avatar_url || '/Avatar/1.png'}" 
									alt="Profil Resmi" 
									class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
								>
								<div>
									<button class="upload-avatar-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
										Fotoğraf Değiştir
									</button>
									<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">JPG, GIF veya PNG. Maksimum 2MB.</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Personal Information -->
					<div class="space-y-6">
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
							<input 
								type="text" 
								id="settingsFullName"
								value="${user.profile?.full_name || ''}"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="Ad ve soyadınızı girin"
							>
						</div>

						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kullanıcı Adı</label>
							<input 
								type="text" 
								id="settingsUsername"
								value="${user.username}"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="Kullanıcı adınızı girin"
							>
						</div>

						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
							<input 
								type="email" 
								id="settingsEmail"
								value="${user.email}"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="E-mail adresinizi girin"
							>
						</div>
					</div>

					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hakkımda</label>
						<textarea 
							id="settingsBio"
							rows="8"
							class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-300"
							placeholder="Kendiniz hakkında birkaç kelime yazın..."
						>${user.profile?.bio || ''}</textarea>
					</div>
				</div>

				<div class="flex justify-end">
					<button class="save-profile-btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
						Değişiklikleri Kaydet
					</button>
				</div>
			</div>
		`;
	}

	private getSecurityTabContent(user: any): string {
		return `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Güvenlik Ayarları</h2>
				</div>

				<!-- Password Change -->
				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Şifre Değiştir</h3>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mevcut Şifre</label>
							<input 
								type="password" 
								id="currentPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="Mevcut şifrenizi girin"
							>
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre</label>
							<input 
								type="password" 
								id="newPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="Yeni şifrenizi girin"
							>
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre Tekrar</label>
							<input 
								type="password" 
								id="confirmPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="Yeni şifrenizi tekrar girin"
							>
						</div>
						<button class="save-password-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300">
							Şifreyi Güncelle
						</button>
					</div>
				</div>

				<!-- 2FA Settings (MyProfile style) -->
				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center space-x-4">
							<div class="w-12 h-12 bg-gradient-to-r ${user.is_2fa_enabled ? 'from-green-500 to-emerald-600' : 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center transition-all duration-300">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<div>
								<h4 class="text-lg font-semibold text-gray-900 dark:text-white">İki Faktörlü Doğrulama (2FA)</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">Durum: <span class="font-semibold ${user.is_2fa_enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${user.is_2fa_enabled ? 'Aktif' : 'Pasif'}</span></p>
							</div>
						</div>
					<button type="button" id="toggle2faBtn" data-enabled="${user.is_2fa_enabled}" class="toggle-2fa-btn px-5 py-3 rounded-xl bg-gradient-to-r ${user.is_2fa_enabled ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'} text-white text-sm font-medium shadow transition">
						${user.is_2fa_enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
					</button>
				</div>
				</div>
			</div>
		`;
	}

	private getAppearanceTabContent(_user: any): string {
		return `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Görünüm Ayarları</h2>
				</div>

				<div class="space-y-6">
					<!-- Theme Selection -->
					<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tema</h3>
						<div class="grid grid-cols-3 gap-4">
							<button data-theme="light" class="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex flex-col items-center space-y-2">
								<div class="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Açık</span>
							</button>
							<button data-theme="dark" class="p-4 rounded-lg border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 flex flex-col items-center space-y-2 bg-blue-50 dark:bg-blue-900/20">
								<div class="w-12 h-12 bg-gray-800 rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
										<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Koyu</span>
							</button>
							<button data-theme="auto" class="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex flex-col items-center space-y-2">
								<div class="w-12 h-12 bg-gradient-to-br from-white to-gray-800 rounded-lg shadow-md flex items-center justify-center">
									<svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
									</svg>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Otomatik</span>
							</button>
						</div>
					</div>

					<!-- Language Selection -->
					<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dil</h3>
						<div class="grid grid-cols-2 gap-4">
							<button data-language="tr" class="p-4 rounded-lg border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20">
								<div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
									<span class="text-white text-sm font-bold">TR</span>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Türkçe</span>
							</button>
							<button data-language="en" class="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all duration-300 flex items-center space-x-3">
								<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
									<span class="text-white text-sm font-bold">EN</span>
								</div>
								<span class="text-sm font-medium text-gray-900 dark:text-white">English</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private getAccountTabContent(user: any): string {
		return `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Hesap Ayarları</h2>
				</div>

				<!-- Account Information -->
				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hesap Bilgileri</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Hesap ID</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${user.id}</span>
						</div>
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Üyelik Tarihi</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${new Date(user.created_at).toLocaleDateString('tr-TR')}</span>
						</div>
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Son Güncelleme</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${new Date(user.updated_at).toLocaleDateString('tr-TR')}</span>
						</div>
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border-2 border-red-200 dark:border-red-700">
					<div class="flex items-center space-x-3 mb-4">
						<div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-red-800 dark:text-red-400">Tehlikeli Bölge</h3>
					</div>
					<p class="text-sm text-red-700 dark:text-red-300 mb-6">Bu işlemler geri alınamaz. Lütfen dikkatli olun.</p>
					<button class="delete-account-btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
						<span class="flex items-center space-x-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
							</svg>
							<span>Hesabımı Sil</span>
						</span>
					</button>
				</div>

				<!-- Delete Account Modal -->
				<div class="delete-modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
						<div class="text-center">
							<div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
								<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
								</svg>
							</div>
							<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Hesabınızı Silmek İstediğinizden Emin misiniz?</h3>
							<p class="text-gray-600 dark:text-gray-400 mb-6">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
							<div class="flex space-x-4">
								<button class="cancel-delete-btn flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300">
									İptal
								</button>
								<button class="confirm-delete-btn flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300">
									Evet, Sil
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private render(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
						<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oturum Açmalısınız</h2>
						<p class="text-gray-600 dark:text-gray-400 mb-6">Ayarlarınızı görüntülemek için önce giriş yapın.</p>
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
					<sidebar-component current-route="settings"></sidebar-component>

					<!-- Main Content -->
					<div class="main-content ${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
						<div class="w-full">
							<!-- Settings Header -->
							<div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 overflow-hidden mb-6">
								<div class="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-black p-8 text-white relative overflow-hidden">
									<!-- Background Pattern -->
									<div class="absolute inset-0 opacity-10">
										<div class="absolute top-4 right-4 text-6xl">⚙️</div>
										<div class="absolute bottom-4 left-4 text-4xl">🔧</div>
										<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">⚙️</div>
									</div>
									
									<div class="relative z-10">
										<h1 class="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
											Ayarlar
										</h1>
										<p class="text-gray-300 text-xl">Hesap ayarlarınızı yönetin</p>
									</div>
								</div>
							</div>

							<!-- Settings Content -->
							<div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 overflow-hidden">
								<div class="flex flex-col lg:flex-row">
									<!-- Tabs Sidebar (narrowed) -->
									<div class="lg:basis-52 xl:basis-56 shrink-0 bg-gray-50/50 dark:bg-gray-900/50 p-4 border-b lg:border-b-0 lg:border-r border-gray-200/50 dark:border-gray-600/50">
										<nav class="space-y-2" id="settingsTabs">
											<button data-tab="profile" class="${''}" type="button">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
												<span>Profil</span>
											</button>
											<button data-tab="security" class="${''}" type="button">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
												<span>Güvenlik</span>
											</button>
											<button data-tab="appearance" class="${''}" type="button">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/></svg>
												<span>Görünüm</span>
											</button>
											<button data-tab="account" class="${''}" type="button">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
												<span>Hesap</span>
											</button>
										</nav>
									</div>

									<!-- Tab Content -->
									<div class="flex-1 min-w-0 p-6 lg:p-8">
										<div class="tab-content">
											${this.getProfileTabContent(user)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.renderTabContent();
		this.updateTabItemStyles();
	}
}

customElements.define('settings-component', SettingsComponent);

export default SettingsComponent;