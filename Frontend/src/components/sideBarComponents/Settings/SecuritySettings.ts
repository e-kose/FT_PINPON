import { Settings } from "./Settings";
import { getUser } from "../../../store/UserStore";
import { changePasswordAsync } from "../../../services/SettingsService";
import { validatePassword } from "../../utils/Validation";
import { router } from "../../../router/Router";
import { t } from "../../../i18n/lang";

const MESSAGE_CONTAINER = ".security-message-container";

class SecuritySettings extends Settings {
	connectedCallback(): void {
		this.renderSection();
	}

	private renderSection(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">${t("security_settings_load_error_title")}</h2>
					<p class="text-gray-600 dark:text-gray-400">${t("security_settings_load_error_description")}</p>
				</div>
			`;
			return;
		}

		const isGoogleUser = !!user.profile?.user_google_id;
		const is2FAEnabled = user.is_2fa_enabled === 1;
		const twoFaStatusBadge = is2FAEnabled 
			? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
					</svg>
					${t("security_settings_2fa_enabled")}
				</span>`
			: `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
					</svg>
					${t("security_settings_2fa_disabled")}
				</span>`;

		this.innerHTML = `
			<div class="space-y-4 sm:space-y-6 md:space-y-8">
				<div class="flex items-center space-x-2 sm:space-x-3">
					<div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
						</svg>
					</div>
					<h2 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${t("security_settings_title")}</h2>
				</div>

				${isGoogleUser ? `
					<!-- Google kullanıcısı için bilgilendirme -->
					<div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border-2 border-blue-200 dark:border-blue-700">
						<div class="flex items-start gap-3 sm:gap-4">
							<div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
									<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
									<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
									<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">${t("security_settings_google_account_title")}</h3>
								<p class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">${t("security_settings_google_account_description")}</p>
								<div class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
									<svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
									<span class="font-medium">${t("security_settings_google_account_info")}</span>
								</div>
							</div>
						</div>
					</div>
				` : `
					<!-- Normal kullanıcı için şifre değiştirme -->
					<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-600/50">
						<h3 class="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">${t("security_settings_change_password_title")}</h3>
						<div class="space-y-3 sm:space-y-4">
							<div>
								<label class="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">${t("security_settings_current_password_label")}</label>
								<input 
									type="password" 
									id="currentPassword"
									class="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
									placeholder="${t("security_settings_current_password_placeholder")}"
								>
							</div>
							<div>
								<label class="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">${t("security_settings_new_password_label")}</label>
								<input 
									type="password" 
									id="newPassword"
									class="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
									placeholder="${t("security_settings_new_password_placeholder")}"
								>
							</div>
							<div>
								<label class="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">${t("security_settings_confirm_password_label")}</label>
								<input 
									type="password" 
									id="confirmPassword"
									class="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
									placeholder="${t("security_settings_confirm_password_placeholder")}"
								>
							</div>
						</div>
						<div class="flex justify-end mt-4 sm:mt-6">
							<button class="save-password-btn w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]">
								${t("security_settings_change_password_button")}
							</button>
						</div>
					</div>
				`}

				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-600/50 space-y-3 sm:space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
								<h3 class="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">${t("security_settings_2fa_title")}</h3>
								${twoFaStatusBadge}
							</div>
							<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">${t("security_settings_2fa_description")}</p>
						</div>
						<button class="toggle-2fa-btn w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 text-base rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap min-h-[44px]">
							${is2FAEnabled ? t("security_settings_2fa_manage") : t("security_settings_2fa_button")}
						</button>
					</div>
				</div>

				<div class="security-message-container mt-4 sm:mt-6"></div>
			</div>
		`;

		this.bindEvents();
	}

	private bindEvents(): void {
		const savePasswordBtn = this.querySelector(".save-password-btn");
		if (savePasswordBtn) {
			savePasswordBtn.addEventListener("click", this.onChangePasswordClick);
		}
		this.querySelector(".toggle-2fa-btn")?.addEventListener("click", this.onToggle2FAClick);
	}

	private onChangePasswordClick = () => {
		this.changePassword();
	};

	private onToggle2FAClick = () => {
		this.toggle2FA();
	};

	private changePassword(): void {
		console.log("Change Password button clicked");
		const currentPasswordInput = this.querySelector<HTMLInputElement>("#currentPassword");
		const newPasswordInput = this.querySelector<HTMLInputElement>("#newPassword");
		const confirmPasswordInput = this.querySelector<HTMLInputElement>("#confirmPassword");

		if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
			this.showErrorMessage(t("common_error"), t("security_settings_fields_load_error"), MESSAGE_CONTAINER);
			return;
		}

		if (
			!validatePassword(currentPasswordInput.value).isValid ||
			!validatePassword(newPasswordInput.value).isValid ||
			newPasswordInput.value !== confirmPasswordInput.value
		) {
			this.showErrorMessage(
				t("common_error"),
				t("security_settings_password_requirements_error"),
				MESSAGE_CONTAINER
			);
			return;
		}

		if (newPasswordInput.value !== confirmPasswordInput.value) {
			this.showErrorMessage(t("common_error"), t("security_settings_password_mismatch_error"), MESSAGE_CONTAINER);
			return;
		}

		changePasswordAsync({
			oldPass: currentPasswordInput.value,
			newPass: newPasswordInput.value
		})
			.then((response) => {
				if (response.success) {
					this.showSuccessMessage(
						t("security_settings_change_password_success_title"),
						t("security_settings_change_password_success_message"),
						MESSAGE_CONTAINER
					);
					this.scheduleMessageCleanup(MESSAGE_CONTAINER);
					currentPasswordInput.value = "";
					newPasswordInput.value = "";
					confirmPasswordInput.value = "";
				} else {
					this.handleApiResponse(response.status ?? 0, MESSAGE_CONTAINER);
				}
			})
			.catch((error) => {
				console.error(t("security_settings_change_password_error_log"), error);
				const status = error?.status || 0;
				const info = this.getUserResponseMessage(status);
				this.showErrorMessage(info.title, info.message, MESSAGE_CONTAINER);
			});
	}

	private toggle2FA(): void {
		router.navigate("/2fa");
	}
}

const SECURITY_SETTINGS_TAG = "security-settings";
if (!customElements.get(SECURITY_SETTINGS_TAG)) {
	customElements.define(SECURITY_SETTINGS_TAG, SecuritySettings);
}

export default SecuritySettings;
