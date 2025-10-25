import "../../utils/Header"
import "../../utils/SideBar";
import { getUser, setUser, getAccessToken } from "../../../store/UserStore";
import { sidebarStateManager } from "../../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../../router/SidebarStateManager";
import { updateUser, updateAvatar, changePasswordAsync } from "../../../services/SettingsService";
import type { UserCredentialsUpdate } from "../../../types/SettingsType";
import messages from "../../utils/Messages";
import { validateFullProfile, validatePassword } from "../../utils/Validation";
import { handleLogin, removeUndefinedKey } from "../../../services/AuthService";
import { router } from "../../../router/Router"

class SettingsComponent extends HTMLElement {

	private sidebarListener: SidebarStateListener | null = null;
	private currentTab: string = 'profile';

	// Error mappings for different status codes
	private userResponseMappings: Record<number, { title: string; message: string; }> = {
		0: { title: 'Bağlantı Hatası', message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.' },
		400: { title: 'Geçersiz Veri', message: 'Gönderilen bilgiler geçersiz. Lütfen kontrol edin.' },
		401: { title: 'Yetkilendirme Hatası', message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' },
		403: { title: 'Erişim Engellendi', message: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.' },
		404: { title: 'Kullanıcı Bulunamadı', message: 'Kullanıcı bilgileri bulunamadı.' },
		409: { title: 'Çakışma Hatası', message: 'Kullanıcı zaten mevcut veya çakışan bir bilgi var.' },
		429: { title: 'Çok Fazla İstek', message: 'Çok fazla istek gönderdiniz. Lütfen bekleyip tekrar deneyin.' },
		500: { title: 'Sunucu Hatası', message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' }
	};

	constructor() {
		super();
		// URL'den tab bilgisini al
		this.initializeTabFromURL();
		this.render();
	}

	connectedCallback(): void {
		this.setupEvents();
		this.setupSidebarListener();
		// Router zaten popstate'i handle ediyor, ayrıca listener eklemiyoruz
	}

	disconnectedCallback(): void {
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

	// URL'den tab bilgisini al ve ayarla
	private initializeTabFromURL(): void {
		const path = window.location.pathname;
		const validTabs = ['profile', 'security', 'appearance', 'account'];
		
		if (path.startsWith('/settings/')) {
			const tabFromURL = path.split('/settings/')[1];
			if (validTabs.includes(tabFromURL)) {
				this.currentTab = tabFromURL;
			}
		} else if (path === '/settings') {
			this.currentTab = 'profile';
		}
	}



	// Error handling methods
	private getUserResponseMessage(status: number): { title: string; message: string; } {
		const errorInfo = this.userResponseMappings[status];

		if (!errorInfo) {
			return {
				title: "Beklenmeyen Hata",
				message: "Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin."
			};
		}
		return errorInfo;
	}

	private handleApiResponse(status: number, messageContainer?: string): void {
		const { title, message } = this.getUserResponseMessage(status);
		const container = messageContainer || this.getCurrentTabMessageContainer();
		messages.showMessage(title, message, "error", container);
		// 7 saniye sonra mesajı temizle
		this.scheduleMessageCleanup(container);
	}

	private handleUpdateResponse(response: { success: boolean; message: string; status: number }, messageContainer?: string): void {
		const container = messageContainer || this.getCurrentTabMessageContainer();
		if (response.success) {
			messages.showMessage("Başarılı", response.message || "Bilgileriniz başarıyla güncellendi.", "success", container);
			// Başarı durumunda cleanup'ı burada değil, handleLogin sonrası yapacağız
		} else {
			this.handleApiResponse(response.status, container);
		}
	}

	// Mesajları belirli süre sonra temizleme
	private scheduleMessageCleanup(container: string): void {
		setTimeout(() => {
			messages.clearMessages(container);
		}, 7000); // 7 saniye
	}

	// Aktif tab'a göre mesaj container'ını belirle
	private getCurrentTabMessageContainer(): string {
		return `.${this.currentTab}-message-container`;
	}

	// Validation hatalarını güzel bir şekilde göster
	private showValidationErrors(errors: Record<string, string>): void {
		const container = document.querySelector('.profile-message-container');
		if (!container) return;

		// Mevcut mesajları temizle
		messages.clearMessages('.profile-message-container');

		// Hata container'ı oluştur
		const errorDiv = document.createElement('div');
		errorDiv.setAttribute('data-message', 'true');
		errorDiv.className = 'mt-6 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 dark:from-red-900/20 dark:via-red-800/30 dark:to-pink-900/20 border-2 border-red-300 dark:border-red-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm';

		// Ana başlık
		const headerDiv = document.createElement('div');
		headerDiv.className = 'flex items-center mb-4';
		
		const iconDiv = document.createElement('div');
		iconDiv.className = 'w-10 h-10 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-3 shadow-md';
		iconDiv.innerHTML = `
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
			</svg>
		`;

		const titleDiv = document.createElement('div');
		titleDiv.innerHTML = `
			<h3 class="text-red-800 dark:text-red-200 font-bold text-lg">⚠️ Form Eksikleri</h3>
			<p class="text-red-600 dark:text-red-300 text-sm">Formu tamamlamak için aşağıdaki alanları kontrol edin</p>
		`;

		headerDiv.appendChild(iconDiv);
		headerDiv.appendChild(titleDiv);

		// Hata listesi
		const errorsList = document.createElement('div');
		errorsList.className = 'space-y-3 mt-4';

		Object.values(errors).forEach((error, index) => {
			const errorItem = document.createElement('div');
			errorItem.className = 'flex items-start p-4 bg-white/70 dark:bg-gray-800/50 rounded-lg border border-red-200 dark:border-red-600/30 hover:bg-white/90 dark:hover:bg-gray-700/50 transition-colors duration-200 shadow-sm';
			
			errorItem.innerHTML = `
				<div class="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
					<span class="text-red-600 dark:text-red-400 text-xs font-bold">${index + 1}</span>
				</div>
				<div class="flex-1">
					<p class="text-red-800 dark:text-red-200 text-sm font-medium leading-relaxed">${error}</p>
				</div>
			`;
			
			errorsList.appendChild(errorItem);
		});

		// Alt bilgi
		const footerDiv = document.createElement('div');
		footerDiv.className = 'mt-4 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-600/30';
		footerDiv.innerHTML = `
			<p class="text-red-700 dark:text-red-300 text-xs flex items-center">
				<svg class="w-4 h-4 mr-2 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				Bu alanları düzelttikten sonra tekrar kaydetmeyi deneyin.
			</p>
		`;

		// Element'leri birleştir
		errorDiv.appendChild(headerDiv);
		errorDiv.appendChild(errorsList);
		errorDiv.appendChild(footerDiv);
		container.appendChild(errorDiv);

		// 8 saniye sonra temizle
		setTimeout(() => {
			if (errorDiv && errorDiv.parentNode) {
				errorDiv.remove();
			}
		}, 8000);
	}

	// Başarı mesajını güzel bir şekilde göster
	private showSuccessMessage(title: string, message: string): void {
		const container = document.querySelector('.profile-message-container');
		if (!container) return;

		// Mevcut mesajları temizle
		messages.clearMessages('.profile-message-container');

		// Başarı container'ı oluştur
		const successDiv = document.createElement('div');
		successDiv.setAttribute('data-message', 'true');
		successDiv.className = 'mt-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-2 border-green-300 dark:border-green-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300';

		successDiv.innerHTML = `
			<div class="flex items-center">
				<div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-green-800 dark:text-green-200 font-bold text-lg mb-1">${title}</h3>
					<p class="text-green-700 dark:text-green-300 text-sm leading-relaxed">${message}</p>
				</div>
				<div class="ml-4">
					<div class="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
						<span class="text-green-600 dark:text-green-400 text-lg">✓</span>
					</div>
				</div>
			</div>
		`;

		container.appendChild(successDiv);

		// 6 saniye sonra temizle
		setTimeout(() => {
			if (successDiv && successDiv.parentNode) {
				successDiv.remove();
			}
		}, 6000);
	}

	// Hata mesajını güzel bir şekilde göster
	private showErrorMessage(title: string, message: string): void {
		const container = document.querySelector('.profile-message-container');
		if (!container) return;

		// Mevcut mesajları temizle
		messages.clearMessages('.profile-message-container');

		// Hata container'ı oluştur
		const errorDiv = document.createElement('div');
		errorDiv.setAttribute('data-message', 'true');
		errorDiv.className = 'mt-4 bg-gradient-to-br from-red-50 via-red-100 to-pink-50 dark:from-red-900/30 dark:via-red-800/30 dark:to-pink-900/30 border-2 border-red-300 dark:border-red-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300';

		errorDiv.innerHTML = `
			<div class="flex items-center">
				<div class="w-12 h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-red-800 dark:text-red-200 font-bold text-lg mb-1">${title}</h3>
					<p class="text-red-700 dark:text-red-300 text-sm leading-relaxed">${message}</p>
				</div>
				<div class="ml-4">
					<div class="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center">
						<span class="text-red-600 dark:text-red-400 text-lg">!</span>
					</div>
				</div>
			</div>
		`;

		container.appendChild(errorDiv);

		// 7 saniye sonra temizle
		setTimeout(() => {
			if (errorDiv && errorDiv.parentNode) {
				errorDiv.remove();
			}
		}, 7000);
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
				const input = this.querySelector('#avatarInput') as HTMLInputElement;
				input.click();
			}
		});

		// Avatar input change
		this.addEventListener('change', (e) => {
			const target = e.target as HTMLElement;
			const avatarInput = target.closest('#avatarInput') as HTMLInputElement;
			if (avatarInput) {
				this.uploadAvatar(avatarInput.files);
			}
		});

		// Form submission prevention
		this.addEventListener('submit', (e) => {
			e.preventDefault();
		});
	}

	private switchTab(tabName: string): void {
		this.currentTab = tabName;
		// Router ile URL'yi güncelle
		router.navigate(`/settings/${tabName}`);
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

	private async saveProfileSettings(): Promise<void> {
		// Form verilerini topla
		const fullNameInput = this.querySelector('#settingsFullName') as HTMLInputElement;
		const usernameInput = this.querySelector('#settingsUsername') as HTMLInputElement;
		const emailInput = this.querySelector('#settingsEmail') as HTMLInputElement;
		const bioInput = this.querySelector('#settingsBio') as HTMLTextAreaElement;

		const userInfo: UserCredentialsUpdate = {
			email: emailInput.value,
			username: usernameInput.value,
			profile: {
				full_name: fullNameInput.value,
				bio: bioInput.value
			}
		};

		removeUndefinedKey(userInfo);
		const validation = validateFullProfile(userInfo);
		
		if (!validation.isValid) {
			this.showValidationErrors(validation.errors);
			return;
		}
		else
		{
			try {
				const response = await updateUser(userInfo);
				this.handleUpdateResponse(response);
				if (response.success) {
					handleLogin().then(() => {
						this.renderTabContent();
						// Başarı mesajını güzel bir şekilde göster
						this.showSuccessMessage("🎉 Profil Güncellendi!", "Profil bilgileriniz başarıyla kaydedildi. Değişiklikler anında aktif oldu.");
					}).catch(() => {
						this.showErrorMessage("❌ Oturum Hatası", "Profil güncellendi ancak oturum yenileme sırasında bir sorun oluştu. Lütfen sayfayı yenileyin.");
					});
				}
			} catch (error) {
				console.error('Profile update error:', error);
				this.showErrorMessage("💥 Bağlantı Sorunu", "Profil güncellenirken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.");
			}
		}
	}



	private changePassword(): void {
		const currentPasswordInput = this.querySelector('#currentPassword') as HTMLInputElement;
		const newPasswordInput = this.querySelector('#newPassword') as HTMLInputElement;
		const confirmPasswordInput = this.querySelector('#confirmPassword') as HTMLInputElement;
		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
		if  (!validatePassword(currentPasswordInput.value) || !validatePassword(newPasswordInput.value) || newPasswordInput.value !== confirmPasswordInput.value)
		{
			this.showErrorMessage("Hata", "Lütfen şifre gereksinimlerini karşıladığınızdan emin olun.");
			return;
		}
		if (newPasswordInput.value !== confirmPasswordInput.value) {
			this.showErrorMessage("Hata", "Yeni şifre ve onay şifresi eşleşmiyor.");
			return;
		}
		
		changePasswordAsync({
			oldPass: currentPasswordInput.value,
			newPass: newPasswordInput.value
		}).then((response) => {
			if (response.success) {
				this.showSuccessMessage("Şifre Değiştirildi!", "Şifreniz başarıyla güncellendi.");
				this.scheduleMessageCleanup(".security-message-container");
			}
		}).catch((error) => {
			console.error('Şifre değiştirme hatası:', error);
			
			const status = error.status || 0;
			const errorInfo = this.userResponseMappings[status];
			if (errorInfo) {
				this.showErrorMessage(errorInfo.title, errorInfo.message);
			} else {
				this.showErrorMessage("❌ Şifre Değiştirme Hatası", "Şifre değiştirilirken bir sorun oluştu. Lütfen tekrar deneyin.");
			}
		});
	}



	private toggle2FA(): void {
		router.navigate('/2fa');
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

	private uploadAvatar(files: FileList | null): void {
		const errors: Record<string, string> = {};
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const maxSize = 2 * 1024 * 1024; // 2MB

		if (!files || files.length === 0) {
			errors.file = "Lütfen bir dosya seçin.";
		} else {
			const file = files[0];

			if (!allowedTypes.includes(file.type)) {
				errors.type = "Geçersiz dosya tipi. Sadece JPG, PNG veya GIF dosyaları kabul edilir.";
			}

			if (file.size > maxSize) {
				errors.size = "Dosya boyutu 2MB'dan büyük olamaz.";
			}
		}

		if (Object.keys(errors).length > 0) {
			this.showValidationErrors(errors);
		} else {
			const file = files?.item(0);
			if (!file) {
				this.showValidationErrors({ file: "Lütfen bir dosya seçin." });
				return;
			}
			const formData = new FormData();
			formData.append('avatar', file);

			// Upload işlemini başlat
			console.log('Uploading avatar...');
			this.performAvatarUpload(formData);
		}
	}

	private async performAvatarUpload(formData: FormData): Promise<void> {
		try {
			const response = await updateAvatar(formData);
			this.handleAvatarUploadResponse(response);
		} catch (error) {
			console.error('Avatar upload error:', error);
			this.showErrorMessage("💥 Yükleme Hatası", "Avatar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
		}
	}

	private handleAvatarUploadResponse(response: { success: boolean; data?: { avatar_url: string }; error?: string }): void {
		if (response.success) {
			const user = getUser();
			if (user && response.data?.avatar_url) {
				user.profile = user.profile || {};
				user.profile.avatar_url = response.data?.avatar_url;
				const token = getAccessToken();
				if (token) {
					setUser(user, token);
				}
				this.renderTabContent();
				this.showSuccessMessage("🎉 Avatar Güncellendi!", "Profil fotoğrafınız başarıyla güncellendi.");
			}
			else
			{
				this.renderTabContent();
				this.showErrorMessage("Avatar Güncellenemedi", "Avatar yüklendi fakat güncellenirken bir sorun oluştu.");
			}
			const avatarInput = this.querySelector('#avatarInput') as HTMLInputElement;
			if (avatarInput) {
				avatarInput.value = '';
			}
		} else {
			// Hata durumları - error mesajını kullan
			this.showErrorMessage("❌ Yükleme Başarısız", response.error || "Avatar yüklenirken bir hata oluştu.");
		}
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
									<input 
										type="file" 
										id="avatarInput" 
										accept="image/jpeg,image/png,image/gif" 
										class="hidden"
									>
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

				<!-- Profil Tab Mesaj Container - En altta -->
				<div class="profile-message-container mt-6"></div>
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

				<!-- Güvenlik Tab Mesaj Container - En altta -->
				<div class="security-message-container mt-6"></div>
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

				<!-- Görünüm Tab Mesaj Container - En altta -->
				<div class="appearance-message-container mt-6"></div>
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

				<!-- Hesap Tab Mesaj Container - En altta -->
				<div class="account-message-container mt-6"></div>
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
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900 bg-[url('/DashboardBackground.jpg')] bg-cover bg-center bg-fixed">
				<!-- Header Component -->
				<header-component></header-component>
				
				<div class="pt-16 md:pt-20 lg:pt-24">
					<!-- Sidebar Component -->
					<sidebar-component current-route="settings"></sidebar-component>

					<!-- Main Content -->
					<div class="main-content ${marginClass} p-4 sm:p-6 lg:p-8 min-h-screen overflow-auto transition-all duration-300 bg-black/30">
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