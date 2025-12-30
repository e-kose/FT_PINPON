import { router } from '../../router/Router';
import { loginAuth } from '../../services/AuthService';
import { getUserLoginData, submitCodeIfValid, setUserLoginData, setUser } from '../../store/UserStore';
import messages from '../utils/Messages';
import { UserForm } from './UserForm';
import { t } from '../../i18n/lang';


class TwoFaLogin extends UserForm {
	private isSubmitting = false;

protected errorMappings: Record<number, { title: string; message: string; }> = 
	{
		400: { title: "twofa_login_error_400_title", message: "twofa_login_error_400_message" },
		401: { title: "twofa_login_error_401_title", message: "twofa_login_error_401_message" },
		403: { title: "twofa_login_error_403_title", message: "twofa_login_error_403_message" },
		404: { title: "twofa_login_error_404_title", message: "twofa_login_error_404_message" },
		429: { title: "twofa_login_error_429_title", message: "twofa_login_error_429_message" },
		500: { title: "twofa_login_error_500_title", message: "twofa_login_error_500_message" }
	};

	protected getAuthPageConfig() {
		return {
			cardTitleKey: "twofa_login_card_title",
			heroSubtitleKey: "twofa_login_subtitle"
		};
	}

	protected createFormContent(): string {
		return this.createForm();
	}
	protected handleSubmit(e: Event): void {
		e.preventDefault();
		submitCodeIfValid(this.handle2FaCode, this.querySelector<HTMLInputElement>('#login-2fa-code'));
	}

	protected setupEvents(): void {
		super.setupEvents();
		const input = this.querySelector<HTMLInputElement>('#login-2fa-code');
		const cancel = this.querySelector<HTMLButtonElement>('[data-action="cancel"]');
		if (input) {
			input.addEventListener('input', () => {
				input.value = input.value.replace(/\D/g, '').slice(0, 6);
			});
			setTimeout(() => input.focus(), 50);
		}
		cancel?.addEventListener('click', (e) => {
			e.preventDefault();
			router.navigate('/login');
		});
	}
	private handle2FaCode = (code: string): void => {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		const loginData = getUserLoginData();
		if (loginData) {
			const updated = { ...loginData, token: code };
			setUserLoginData(updated);
			loginAuth(updated).then(({ status, ok, data }) => {
				if (ok) {
					if (data && data.success && data.user) {
						const token = data.accesstoken || data.token;
						if (token)
							setUser(data.user, token)
						messages.showLoadingAnimation('#inline-msg');
						setTimeout(()=> router.navigate('/'), 800);
					} else
						this.handleApiError(500, '#inline-msg');
				} else 
					this.handleApiError(status, '#inline-msg');
				this.isSubmitting = false;
			}).catch((error) => {
				console.error(t("twofa_login_error_log"), error);
				this.handleApiError(500, '#inline-msg');
				this.isSubmitting = false;
			});
		} else {
			this.isSubmitting = false;
		}
	}
	private createForm(): string {
		return `
		<form class="space-y-4">
			<div class="flex flex-col items-center gap-5">
				<div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md ring-4 ring-indigo-500/10">🔐</div>
				<div class="w-full flex flex-col items-center gap-3">
					<label for="login-2fa-code" class="text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">${t("twofa_login_code_label")}</label>
					<input id="login-2fa-code" type="text" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="${t("twofa_login_code_placeholder")}" class="w-full max-w-[220px] text-center text-lg sm:text-xl font-mono tracking-[0.35em] px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 transition" />
					<p class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>${t("twofa_login_code_hint")}</p>
				</div>
				<div class="flex flex-col gap-2 w-full max-w-xs">
					<button type="submit" data-action="submit" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-base shadow-md transition disabled:opacity-60 min-h-[44px]">${t("twofa_login_submit_button")}</button>
					<button type="button" data-action="cancel" class="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition min-h-[44px]">${t("twofa_login_cancel_button")}</button>
				</div>
				<div id="inline-msg" class="w-full text-center min-h-[32px]"></div>
			</div>
		</form>`
	}
	
}
customElements.define('twofa-login', TwoFaLogin);
export default TwoFaLogin;
