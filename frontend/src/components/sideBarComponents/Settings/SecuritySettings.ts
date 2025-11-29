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

		this.innerHTML = `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">${t("security_settings_title")}</h2>
				</div>

				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${t("security_settings_change_password_title")}</h3>
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${t("security_settings_current_password_label")}</label>
							<input 
								type="password" 
								id="currentPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="${t("security_settings_current_password_placeholder")}"
							>
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${t("security_settings_new_password_label")}</label>
							<input 
								type="password" 
								id="newPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="${t("security_settings_new_password_placeholder")}"
							>
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${t("security_settings_confirm_password_label")}</label>
							<input 
								type="password" 
								id="confirmPassword"
								class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
								placeholder="${t("security_settings_confirm_password_placeholder")}"
							>
						</div>
					</div>
					<div class="flex justify-end mt-6">
						<button class="save-password-btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
							${t("security_settings_change_password_button")}
						</button>
					</div>
				</div>

				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">${t("security_settings_2fa_title")}</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">${t("security_settings_2fa_description")}</p>
						</div>
						<button class="toggle-2fa-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
							${t("security_settings_2fa_button")}
						</button>
					</div>
				</div>

				<div class="security-message-container mt-6"></div>
			</div>
		`;

		this.bindEvents();
	}

	private bindEvents(): void {
		this.querySelector(".save-password-btn")?.addEventListener("click", this.onChangePasswordClick);
		this.querySelector(".toggle-2fa-btn")?.addEventListener("click", this.onToggle2FAClick);
	}

	private onChangePasswordClick = () => {
		this.changePassword();
	};

	private onToggle2FAClick = () => {
		this.toggle2FA();
	};

	private changePassword(): void {
		const currentPasswordInput = this.querySelector<HTMLInputElement>("#currentPassword");
		const newPasswordInput = this.querySelector<HTMLInputElement>("#newPassword");
		const confirmPasswordInput = this.querySelector<HTMLInputElement>("#confirmPassword");

		if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
			this.showErrorMessage(t("common_error"), t("security_settings_fields_load_error"), MESSAGE_CONTAINER);
			return;
		}

		if (
			!validatePassword(currentPasswordInput.value) ||
			!validatePassword(newPasswordInput.value) ||
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
