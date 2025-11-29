import { Settings } from "./Settings";
import { getUser } from "../../../store/UserStore";
import { t } from "../../../i18n/lang";

const MESSAGE_CONTAINER = ".account-message-container";

class AccountSettings extends Settings {
	connectedCallback(): void {
		this.renderSection();
	}

	private renderSection(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
				<div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">${t("account_settings_load_error_title")}</h2>
					<p class="text-gray-600 dark:text-gray-400">${t("account_settings_load_error_description")}</p>
				</div>
			`;
			return;
		}

		this.innerHTML = `
			<div class="space-y-8">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">${t("account_settings_title")}</h2>
				</div>

				<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${t("account_settings_info_title")}</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("account_settings_field_id")}</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${user.id}</span>
						</div>
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("account_settings_field_created")}</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${new Date(user.created_at).toLocaleDateString("tr-TR")}</span>
						</div>
						<div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("account_settings_field_updated")}</span>
							<span class="text-sm font-bold text-gray-900 dark:text-white">${new Date(user.updated_at).toLocaleDateString("tr-TR")}</span>
						</div>
					</div>
				</div>

				<div class="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border-2 border-red-200 dark:border-red-700">
					<div class="flex items-center space-x-3 mb-4">
						<div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-red-800 dark:text-red-400">${t("account_settings_danger_zone_title")}</h3>
					</div>
					<p class="text-sm text-red-700 dark:text-red-300 mb-6">${t("account_settings_danger_zone_description")}</p>
					<button class="delete-account-btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
						<span class="flex items-center space-x-2 justify-center">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
							</svg>
							<span>${t("account_settings_delete_button")}</span>
						</span>
					</button>
				</div>

				<div class="delete-modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
						<div class="text-center">
							<div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
								<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
								</svg>
							</div>
							<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">${t("account_settings_delete_modal_title")}</h3>
							<p class="text-gray-600 dark:text-gray-400 mb-6">${t("account_settings_delete_modal_description")}</p>
							<div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
								<button class="cancel-delete-btn flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300">
									${t("common_cancel")}
								</button>
								<button class="confirm-delete-btn flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300">
									${t("account_settings_delete_confirm_button")}
								</button>
							</div>
						</div>
					</div>
				</div>

				<div class="account-message-container mt-6"></div>
			</div>
		`;

		this.bindEvents();
	}

	private bindEvents(): void {
		this.querySelector(".delete-account-btn")?.addEventListener("click", this.onDeleteAccountClick);
		this.querySelector(".confirm-delete-btn")?.addEventListener("click", this.onConfirmDeleteClick);
		this.querySelector(".cancel-delete-btn")?.addEventListener("click", this.onCancelDeleteClick);
	}

	private onDeleteAccountClick = () => {
		this.showDeleteAccountModal();
	};

	private onConfirmDeleteClick = () => {
		this.deleteAccount();
	};

	private onCancelDeleteClick = () => {
		this.hideDeleteAccountModal();
	};

	private showDeleteAccountModal(): void {
		this.querySelector(".delete-modal")?.classList.remove("hidden");
	}

	private hideDeleteAccountModal(): void {
		this.querySelector(".delete-modal")?.classList.add("hidden");
	}

	private deleteAccount(): void {
		console.log(t("account_settings_delete_log"));
		this.hideDeleteAccountModal();
		this.showErrorMessage(
			t("account_settings_delete_info_title"),
			t("account_settings_delete_info_message"),
			MESSAGE_CONTAINER
		);
	}
}

const ACCOUNT_SETTINGS_TAG = "account-settings";
if (!customElements.get(ACCOUNT_SETTINGS_TAG)) {
	customElements.define(ACCOUNT_SETTINGS_TAG, AccountSettings);
}

export default AccountSettings;
