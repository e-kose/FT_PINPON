import { UserForm } from "./UserForm";
import { router } from "../../router/Router";
import messages from "../utils/Messages";
import { t } from "../../i18n/lang";

interface UserSignup {
	email: string;
	username: string;
	password: string;
	profile: {
		full_name: string;
	}
}

export default class SignupForm extends UserForm {
	protected errorMappings = {
		400: {
			title: "signup_error_400_title",
			message: "signup_error_400_message"
		},
		409: {
			title: "signup_error_409_title",
			message: "signup_error_409_message"
		},
		500: {
			title: "signup_error_500_title",
			message: "signup_error_500_message"
		}
	};

	protected getAuthPageConfig() {
		return {
			cardTitleKey: "signup_form_title",
			heroSubtitleKey: "signup_hero_subtitle"
		};
	}

	protected createFormContent(): string {
		return `
			<form class="space-y-3 sm:space-y-4 md:space-y-5" action="#">
				<div>
					<label for="fullName" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${t("signup_form_fullname_label")}</label>
					<input type="text" name="fullName" id="fullName" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="${t("signup_form_fullname_placeholder")}" required>
				</div>
				<div>
					<label for="username" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${t("signup_form_username_label")}</label>
					<input type="text" name="username" id="username" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="${t("signup_form_username_placeholder")}" required>
				</div>
				<div>
					<label for="email" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${t("signup_form_email_label")}</label>
					<input type="email" name="email" id="email" title="${t("signup_form_email_hint")}" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="${t("signup_form_email_placeholder")}" required>
				</div>
				<div>
					<label for="password" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${t("signup_form_password_label")}</label>
					<input type="password" name="password" id="password" placeholder="${t("signup_form_password_placeholder")}" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" required>
				</div>
				<button type="submit" class="w-full text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base px-4 py-2.5 sm:py-3 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[44px]">${t("signup_form_submit")}</button>
				<button 
					type="button"
					id="googleButton" 
					class="w-full text-gray-900 dark:text-white bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-600/80 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-base px-4 py-2.5 sm:py-3 text-center inline-flex items-center justify-center backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[44px]">
					<svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span class="hidden sm:inline">${t("signup_google_button_full")}</span>
					<span class="sm:hidden">${t("signup_google_button_short")}</span>
				</button>
				<p class="text-xs sm:text-sm font-light text-gray-600 dark:text-gray-300 text-center">
					${t("signup_form_have_account")}
					<a 
						id="loginLink"
						href="/login" 
						class="font-medium text-white bg-blue-900 hover:bg-blue-800 px-2 sm:px-3 py-1.5 rounded-lg hover:underline transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-block text-xs sm:text-sm">${t("signup_form_login_cta")}</a>
				</p>
				<div id="messageContainer" class="mt-3"></div>
			</form>
		`;
	}

	protected setupEvents(): void {
		super.setupEvents();

		const googleButton = this.querySelector("#googleButton") as HTMLButtonElement | null;
		googleButton?.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleGoogleAuth();
		});

		const loginLink = this.querySelector("#loginLink") as HTMLAnchorElement | null;
		loginLink?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/login");
		});
	}

	protected handleSubmit(e: Event): void {
		e.preventDefault();
		const formData = new FormData(this.form);

		const userData: UserSignup = {
			email: this.sanitizeInput(formData.get("email") as string || ""),
			username: this.sanitizeInput(formData.get("username") as string || ""),
			password: this.sanitizeInput(formData.get("password") as string || ""),
			profile: {
				full_name: this.sanitizeInput(formData.get("fullName") as string || "")
			}
		};

		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
		if (!this.checkInput(emailPattern, '#email', 'label[for="email"]', "signup_form_email_label")) {
			return;
		}

		const fullNamePattern = /^[a-zA-Z\s]+$/;
		if (!this.checkInput(fullNamePattern, '#fullName', 'label[for="fullName"]', "signup_form_fullname_label")) {
			return;
		}

		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
		if (!this.checkInput(passwordPattern, '#password', 'label[for="password"]', "signup_form_password_label")) {
			return;
		}

		fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userData)
		})
			.then(res => res.text().then(text => ({
				status: res.status,
				ok: res.ok,
				data: text ? JSON.parse(text) : {}
			})))
			.then(({ status, ok, data }) => {
				if (ok) {
					this.handleSuccessfulRegistration(data);
				} else {
					this.handleApiError(status, "#messageContainer");
				}
			})
			.catch(error => {
				console.error("Registration error:", error);
				this.handleNetworkError(error, "#messageContainer");
			});
	}

	private handleSuccessfulRegistration(data: any): void {
		if (!data.success) {
			messages.showMessage(t("signup_failure_title"), t("signup_failure_fallback"), "error", "#messageContainer");
			return;
		}

		messages.showMessage(t("common_success"), t("signup_success_message"), "success", "#messageContainer");
		setTimeout(() => {
			router.navigate("/login");
		}, 2000);
	}
}

customElements.define("signup-form", SignupForm);
