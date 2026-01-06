import { router } from "../../router/Router";
import { fetchUser, loginAuth } from "../../services/AuthService";
import type { UserLogin } from "../../types/AuthType";
import messages from "../utils/Messages";
import { t } from "../../i18n/lang";
import { observeLanguageChange } from "../../i18n/useTranslation";
import { APP_CONTAINER_NARROW } from "../utils/Layout";

interface AuthPageConfig {
	cardTitleKey: string;
	heroSubtitleKey: string;
}

export abstract class UserForm extends HTMLElement {
	protected form!: HTMLFormElement;
	private disposeLanguageListener: (() => void) | null = null;

	protected abstract errorMappings: Record<number, { title: string; message: string }>;

	connectedCallback(): void {
		this.renderForm();
		if (this.disposeLanguageListener) {
			this.disposeLanguageListener();
		}
		this.disposeLanguageListener = observeLanguageChange(() => this.renderForm());
	}

	disconnectedCallback(): void {
		if (this.disposeLanguageListener) {
			this.disposeLanguageListener();
			this.disposeLanguageListener = null;
		}
	}

	protected renderForm(): void {
		const config = this.getAuthPageConfig();
		const content = this.createFormContent();
		this.innerHTML = this.renderAuthPage(content, config);
		this.form = this.querySelector("form") as HTMLFormElement;
		this.setupEvents();
	}

	protected handleGoogleAuth(): void {
	const authUrl = import.meta.env.VITE_GOOGLE_AUTH_ENDPOINT;
	const popupWidth = 500;
	const popupHeight = 600;
	const left = window.screenX + (window.outerWidth - popupWidth) / 2;
	const top = window.screenY + (window.outerHeight - popupHeight) / 2;
	const features = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`;

	const messageContainer = "#messageContainer";

	messages.showLoadingAnimation(messageContainer);

	const popup = window.open(authUrl, "googleAuthPopup", features);

	if (!popup) {
		// Popup bloklandı -> fallback: tam sayfa yönlendirme
		window.location.href = authUrl;
		return;
	}

	// The backend sends postMessage to window.location.origin (frontend origin)
	// So we need to check against our own origin, not the API origin
	const expectedOrigin = window.location.origin;

	console.log("-----------------------------> Listening for messages from origin:", expectedOrigin);
	const onMessage = (event: MessageEvent) => {
		console.log("event.origin:", event.origin);
		// Check if message is from our own origin (where backend sends the postMessage)
		if (event.origin !== expectedOrigin) {
			console.warn("Ignored message from unexpected origin:", event.origin);
			return;
		}
		console.log("-----------------------------> Message received from origin:", event.origin);
		if (!event.data || event.data.type !== "GOOGLE_AUTH_RESULT") {
			console.log("Ignored message with wrong type:", event.data?.type);
			return;
		}
		window.removeEventListener("message", onMessage);
		try {
			const payload = event.data.data;
			console.log("-----------------------------> Received Google auth response:", payload);
			void this.handleGoogleAuthResponse(payload, messageContainer);
		} finally {
			try {
				popup.close();
			} catch {
				console.warn("Popup could not be closed automatically.");
			}
		}
	};

	window.addEventListener("message", onMessage);

	popup.focus();
}

	protected async handleGoogleAuthResponse(data: any, messageContainer: string): Promise<void> {
		if (!data.success) {
			messages.showMessage(t("login_generic_error_title"), t("login_generic_error_message"), "error", messageContainer);
			return;
		}

		if (!data.user || typeof data.user !== "object") {
			messages.showMessage(t("common_error"), t("login_user_fetch_error"), "error", messageContainer);
			return;
		}

		const token = data.accesstoken || data.token;
		if (!token) {
			messages.showMessage(t("common_error"), t("login_token_missing"), "error", messageContainer);
			return;
		}

		messages.showLoadingAnimation(messageContainer);

		try {
			const valid = await fetchUser(token);
			if (valid) {
				setTimeout(() => {
					router.navigate("/");
				}, 1000);
			} else {
				messages.showMessage(t("common_error"), t("login_user_validation_error"), "error", messageContainer);
			}
		} catch (error) {
			this.handleNetworkError(error, messageContainer);
		}
	}

	protected abstract createFormContent(): string;
	protected abstract getAuthPageConfig(): AuthPageConfig;
	protected abstract handleSubmit(e: Event): void;

	protected renderAuthPage(content: string, config: AuthPageConfig): string {
		return `
			<section class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<div class="flex flex-col items-center justify-center min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))">
					<div class="${APP_CONTAINER_NARROW} w-full flex flex-col items-center py-6 sm:py-8 space-y-6 sm:space-y-8">
						<div id="headerSection" class="flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform duration-300">
							<div class="flex flex-col sm:flex-row items-center mb-3 md:mb-4">
								<img class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-2 sm:mb-0 sm:mr-3 md:mr-4 drop-shadow-2xl" src="/pong.png" alt="${t("auth_brand_logo_alt")}">
								<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl tracking-wide text-center sm:text-left break-words">
									Ft_Transcendance
								</h1>
							</div>
							<p class="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-lg font-light max-w-prose">
								${t(config.heroSubtitleKey)}
							</p>
						</div>
						<div class="w-full max-w-md sm:max-w-lg bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-lg shadow-xl border border-white/20">
							<div class="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
								<h2 class="text-base sm:text-lg md:text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white text-center">
									${t(config.cardTitleKey)}
								</h2>
								${content}
							</div>
						</div>
					</div>
				</div>
			</section>
		`;
	}

	protected setupEvents(): void {
		this.form?.addEventListener("submit", this.handleSubmit.bind(this));
		const headerSection = this.querySelector("#headerSection");
		headerSection?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/");
		});
	}

	protected sanitizeInput(input: string): string {
		return input.trim()
			.replace(/[<>]/g, "")
			.replace(/javascript:/gi, "")
			.replace(/on\w+=/gi, "");
	}

	protected checkInput(rule: RegExp, inputSelector: string, labelSelector: string, labelKey: string): boolean {
		const input = this.querySelector(inputSelector) as HTMLInputElement | null;
		const label = this.querySelector(labelSelector) as HTMLLabelElement | null;

		if (!input || !label) return true;

		const labelText = t(labelKey);
		if (!rule.test(input.value)) {
			label.innerHTML = `${labelText} <span class="text-red-500 text-xs">(${t("form_validation_generic_hint")})</span>`;
			label.classList.add("text-red-500");

			const handleInput = () => {
				if (rule.test(input.value)) {
					label.innerHTML = labelText;
					label.classList.remove("text-red-500");
					input.removeEventListener("input", handleInput);
				}
			};

			input.addEventListener("input", handleInput);
			return false;
		}

		return true;
	}

	protected getErrorMessage(status: number): { title: string; message: string } {
		const errorInfo = this.errorMappings[status];
		if (!errorInfo) {
			return {
				title: t("common_error_unexpected_title"),
				message: t("common_error_unexpected_message")
			};
		}
		return {
			title: t(errorInfo.title),
			message: t(errorInfo.message)
		};
	}

	protected handleApiError(status: number, messageContainer: string): void {
		const { title, message } = this.getErrorMessage(status);
		messages.showMessage(title, message, "error", messageContainer);
	}

	protected handleNetworkError(error: unknown, messageContainer: string): void {
		let userMessage = t("network_error_generic_message");

		if (error instanceof TypeError && error.message.includes("fetch")) {
			userMessage = t("network_error_check_connection");
		} else if (error instanceof Error) {
			if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
				userMessage = t("network_error_unreachable");
			} else if (error.message.includes("timeout")) {
				userMessage = t("network_error_timeout");
			}
		}

		messages.showMessage(t("network_error_title"), userMessage, "error", messageContainer);
	}

	protected async loginCheck(data: any, messageContainer: string): Promise<void> {
		if (!data.success) {
			messages.showMessage(t("login_generic_error_title"), t("login_generic_error_message"), "error", messageContainer);
			return;
		}

		if (!data.user || typeof data.user !== "object") {
			messages.showMessage(t("common_error"), t("login_user_fetch_error"), "error", messageContainer);
			return;
		}

		messages.showLoadingAnimation(messageContainer);

		// fetchUser already called in loginAuth, just navigate
		setTimeout(() => {
			router.navigate("/");
		}, 1000);
	}

	protected async loginValidation(userData: UserLogin, messageContainer: string): Promise<void> {
		try {
			const response = await loginAuth(userData);
			if (response && response.ok) {
				this.loginCheck(response.data, messageContainer);
			} else if (response) {
				if (response.status === 401 && response.data?.message === "2FA token is required") {
					messages.showLoadingAnimation(messageContainer);
					setTimeout(() => router.navigate("/2fa-login"), 400);
					return;
				}
				this.handleApiError(response.status, messageContainer);
			}
		} catch (error) {
			this.handleNetworkError(error, messageContainer);
		}
	}
}
