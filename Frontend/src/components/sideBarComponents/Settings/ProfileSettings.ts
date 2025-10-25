import { Settings } from "./Settings";
import { getUser, setUser, getAccessToken } from "../../../store/UserStore";
import { updateUser, updateAvatar } from "../../../services/SettingsService";
import { handleLogin, removeUndefinedKey } from "../../../services/AuthService";
import type { UserCredentialsUpdate } from "../../../types/SettingsType";
import { validateFullProfile } from "../../utils/Validation";

const MESSAGE_CONTAINER = ".profile-message-container";

class ProfileSettings extends Settings {
	connectedCallback(): void {
		this.renderSection();
	}

	private renderSection(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Profil bilgileri yüklenemedi</h2>
					<p class="text-gray-600 dark:text-gray-400">Lütfen tekrar giriş yapmayı deneyin.</p>
				</div>
			`;
			return;
		}

		this.innerHTML = `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div class="lg:col-span-2">
						<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Fotoğrafı</h3>
							<div class="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
								<img 
									src="${user.profile?.avatar_url || "/Avatar/1.png"}" 
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

					<div class="space-y-6">
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
							<input 
								type="text" 
								id="settingsFullName"
								value="${user.profile?.full_name || ""}"
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
						>${user.profile?.bio || ""}</textarea>
					</div>
				</div>

				<div class="flex justify-end">
					<button class="save-profile-btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
						Değişiklikleri Kaydet
					</button>
				</div>

				<div class="profile-message-container mt-6"></div>
			</div>
		`;

		this.bindEvents();
	}

	private bindEvents(): void {
		this.querySelector(".save-profile-btn")?.addEventListener("click", this.onSaveProfile);
		this.querySelector(".upload-avatar-btn")?.addEventListener("click", this.onAvatarButtonClick);
		this.querySelector<HTMLInputElement>("#avatarInput")?.addEventListener("change", this.onAvatarInputChange);
	}

	private onSaveProfile = () => {
		void this.saveProfileSettings();
	};

	private onAvatarButtonClick = () => {
		this.querySelector<HTMLInputElement>("#avatarInput")?.click();
	};

	private onAvatarInputChange = (event: Event) => {
		const target = event.target as HTMLInputElement | null;
		this.uploadAvatar(target?.files || null);
	};

	private async saveProfileSettings(): Promise<void> {
		const fullNameInput = this.querySelector<HTMLInputElement>("#settingsFullName");
		const usernameInput = this.querySelector<HTMLInputElement>("#settingsUsername");
		const emailInput = this.querySelector<HTMLInputElement>("#settingsEmail");
		const bioInput = this.querySelector<HTMLTextAreaElement>("#settingsBio");

		if (!fullNameInput || !usernameInput || !emailInput || !bioInput) {
			this.showErrorMessage("Hata", "Form bileşenleri yüklenemedi.", MESSAGE_CONTAINER);
			return;
		}

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
			this.showValidationErrors(validation.errors, MESSAGE_CONTAINER);
			return;
		}

		try {
			const response = await updateUser(userInfo);
			this.handleUpdateResponse(response, MESSAGE_CONTAINER);

			if (response.success) {
				await handleLogin();
				this.renderSection();
				this.showSuccessMessage(
					"🎉 Profil Güncellendi!",
					"Profil bilgileriniz başarıyla kaydedildi. Değişiklikler anında aktif oldu.",
					MESSAGE_CONTAINER
				);
			}
		} catch (error) {
			console.error("Profile update error:", error);
			this.showErrorMessage(
				"💥 Bağlantı Sorunu",
				"Profil güncellenirken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.",
				MESSAGE_CONTAINER
			);
		}
	}

	private uploadAvatar(files: FileList | null): void {
		const errors: Record<string, string> = {};
		const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxSize = 2 * 1024 * 1024;

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
			this.showValidationErrors(errors, MESSAGE_CONTAINER);
			return;
		}

		const file = files?.item(0);
		if (!file) {
			this.showValidationErrors({ file: "Lütfen bir dosya seçin." }, MESSAGE_CONTAINER);
			return;
		}

		const formData = new FormData();
		formData.append("avatar", file);
		void this.performAvatarUpload(formData);
	}

	private async performAvatarUpload(formData: FormData): Promise<void> {
		try {
			const response = await updateAvatar(formData);
			this.handleAvatarUploadResponse(response);
		} catch (error) {
			console.error("Avatar upload error:", error);
			this.showErrorMessage(
				"💥 Yükleme Hatası",
				"Avatar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
				MESSAGE_CONTAINER
			);
		}
	}

	private handleAvatarUploadResponse(response: { success: boolean; data?: { avatar_url: string }; error?: string }): void {
		if (!response.success) {
			this.showErrorMessage(
				"❌ Yükleme Başarısız",
				response.error || "Avatar yüklenirken bir hata oluştu.",
				MESSAGE_CONTAINER
			);
			return;
		}

		const user = getUser();

		if (user && response.data?.avatar_url) {
			user.profile = user.profile || {};
			user.profile.avatar_url = response.data.avatar_url;

			const token = getAccessToken();
			if (token) {
				setUser(user, token);
			}

			this.renderSection();
			this.showSuccessMessage(
				"🎉 Avatar Güncellendi!",
				"Profil fotoğrafınız başarıyla güncellendi.",
				MESSAGE_CONTAINER
			);
		} else {
			this.renderSection();
			this.showErrorMessage(
				"Avatar Güncellenemedi",
				"Avatar yüklendi fakat güncellenirken bir sorun oluştu.",
				MESSAGE_CONTAINER
			);
		}

		const avatarInput = this.querySelector<HTMLInputElement>("#avatarInput");
		if (avatarInput) {
			avatarInput.value = "";
		}
	}
}

const PROFILE_SETTINGS_TAG = "profile-settings";
if (!customElements.get(PROFILE_SETTINGS_TAG)) {
	customElements.define(PROFILE_SETTINGS_TAG, ProfileSettings);
}

export default ProfileSettings;
