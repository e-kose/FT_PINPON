import "./Header";
import "./SideBar";
import { getUser } from "../../store/UserStore";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { router } from "../../router/Router";
import { disable2FA, enable2Fa, set2FA } from "../../services/AuthService";
import messages from "./Messages";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

class TwoFaAuth extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private qrData: string | null = null;
	private readonly messageHostSelector = "#twofa-message-host";
	private pendingMessage:
		| { status: "enable" | "disable"; success: boolean; override?: { titleKey?: string; messageKey?: string; icon?: string; theme?: string } }
		| null = null;

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.sidebarListener = (state) => this.adjustMainContentMargin(state.isCollapsed);
			sidebarStateManager.addListener(this.sidebarListener);
		}
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
	}

	protected renderComponent(): void {
		const user = getUser();
		if (!user) {
			this.innerHTML = `
				<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-white/20 dark:border-white/10">
						<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${t("twofa_login_required_title")}</h2>
						<p class="text-gray-600 dark:text-gray-300">${t("twofa_login_required_description")}</p>
					</div>
				</div>
			`;
			return;
		}

		const marginClass = sidebarStateManager.getMarginClass();
		const enabled = user.is_2fa_enabled === 1;

		this.innerHTML = `
			<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
				<header-component></header-component>
				<div class="pt-16 md:pt-20 lg:pt-24">
					<sidebar-component current-route="2fa"></sidebar-component>
					<div class="main-content ${marginClass} p-4 sm:p-6 lg:p-8 transition-all duration-300">
						<section class="mx-auto w-full max-w-4xl space-y-6">
							<div class="rounded-2xl border border-white/40 bg-white/85 dark:border-white/10 dark:bg-gray-900/70 shadow-xl p-6 sm:p-8">
								<div class="text-center space-y-3 mb-6">
									<span class="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-lg">🔐</span>
									<h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${t("twofa_page_title")}</h1>
									<p class="text-sm text-gray-600 dark:text-gray-300">${t("twofa_page_subtitle")}</p>
								</div>
								<div id="twofa-message-host" class="mb-6"></div>
								${enabled ? this.renderEnabledSection() : this.renderDisabledSection()}
								${!enabled && this.qrData ? this.renderQrSection() : ""}
								<div class="mt-6 flex justify-center">
									<button data-back class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 text-sm">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
										</svg>
										${t("twofa_back_button")}
									</button>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.attachEvents();
		this.adjustMainContentMargin(sidebarStateManager.getState().isCollapsed);
		if (this.pendingMessage) {
			const payload = this.pendingMessage;
			this.pendingMessage = null;
			messages.twoFaMessage(payload.status, payload.success, this.messageHostSelector, payload.override);
		}
	}

	private renderEnabledSection(): string {
		return `
			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-green-200/70 bg-green-50/80 dark:border-green-700/40 dark:bg-green-900/30 p-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow">✅</div>
						<div>
							<h2 class="text-lg font-semibold text-green-700 dark:text-green-200">${t("twofa_status_enabled_title")}</h2>
							<p class="text-sm text-green-600 dark:text-green-300">${t("twofa_status_enabled_badge")}</p>
						</div>
					</div>
					<p class="text-sm text-green-700/90 dark:text-green-200/90 leading-relaxed">${t("twofa_status_enabled_description")}</p>
				</div>
				<div class="rounded-xl border border-green-200/70 bg-white dark:bg-gray-900/40 p-5">
					<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">${t("twofa_tips_title")}</h3>
					<ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
						<li class="flex gap-2 items-start"><span class="mt-1 h-2 w-2 rounded-full bg-green-500"></span>${t("twofa_tip_backup_codes")}</li>
						<li class="flex gap-2 items-start"><span class="mt-1 h-2 w-2 rounded-full bg-green-500"></span>${t("twofa_tip_device_change")}</li>
						<li class="flex gap-2 items-start"><span class="mt-1 h-2 w-2 rounded-full bg-green-500"></span>${t("twofa_tip_regenerate")}</li>
					</ul>
					<button data-action="disable" class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 transition-colors">
						${t("twofa_disable_button")}
					</button>
				</div>
			</div>
		`;
	}

	private renderDisabledSection(): string {
		return `
			<div class="rounded-xl border border-blue-200/60 bg-white dark:border-blue-700/40 dark:bg-gray-900/40 p-5">
				<div class="flex items-start gap-4">
					<div class="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-600 text-white text-2xl shadow">🛡️</div>
					<div class="flex-1 space-y-3">
						<h2 class="text-lg font-semibold text-blue-700 dark:text-blue-200">${t("twofa_status_disabled_title")}</h2>
						<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${t("twofa_status_disabled_description")}</p>
						<ol class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
							<li class="flex gap-3 items-start">
								<span class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">1</span>
								<span>${t("twofa_step_generate_qr")}</span>
							</li>
							<li class="flex gap-3 items-start">
								<span class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">2</span>
								<span>${t("twofa_step_scan_qr")}</span>
							</li>
							<li class="flex gap-3 items-start">
								<span class="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold mt-0.5">3</span>
								<span>${t("twofa_step_enter_code")}</span>
							</li>
						</ol>
						<button data-action="begin" class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors">
							${t("twofa_start_button")}
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private renderQrSection(): string {
		return `
			<div class="rounded-xl border border-indigo-200/60 bg-indigo-50/60 dark:border-indigo-700/40 dark:bg-indigo-900/30 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-4">
					<img src="${this.qrData}" alt="${t("twofa_qr_alt")}" class="w-40 h-40 rounded-lg border border-white shadow-md bg-white" />
					<div class="text-sm text-indigo-900 dark:text-indigo-100 space-y-2">
						<p class="font-semibold">${t("twofa_qr_heading")}</p>
						<p class="text-xs leading-relaxed text-indigo-800/80 dark:text-indigo-100/80">${t("twofa_qr_description")}</p>
						<button data-action="cancel-qr" class="text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:underline">
							${t("twofa_cancel_qr")}
						</button>
					</div>
				</div>
				<div class="flex-1 w-full md:w-auto">
					<label for="twofa-code" class="block text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-1">${t("twofa_code_label")}</label>
					<div class="flex gap-2">
						<input id="twofa-code" inputmode="numeric" maxlength="6" class="flex-1 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white/80 dark:bg-gray-900 px-3 py-2 text-sm text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="${t("twofa_code_placeholder")}" aria-label="${t("twofa_code_placeholder")}">
						<button data-action="verify" class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-colors">
							${t("twofa_verify_button")}
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private attachEvents(): void {
		this.querySelector('[data-action="begin"]')?.addEventListener("click", () => this.startSetup());
		this.querySelector('[data-action="verify"]')?.addEventListener("click", () => this.submitCodeIfValid());
		this.querySelector('[data-action="disable"]')?.addEventListener("click", () => this.handleDisable());
		this.querySelector('[data-action="cancel-qr"]')?.addEventListener("click", () => {
			this.qrData = null;
			this.renderAndBind();
		});
		this.querySelector('[data-back]')?.addEventListener("click", () => router.navigate("/settings/security"));

		const codeInput = this.querySelector<HTMLInputElement>("#twofa-code");
		codeInput?.addEventListener("input", () => {
			codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
		});
		codeInput?.addEventListener("keyup", (event) => {
			if ((event as KeyboardEvent).key === "Enter") {
				this.submitCodeIfValid();
			}
		});
	}

	private async startSetup(): Promise<void> {
		if (this.qrData) return;
		const result = await set2FA();
		if (result.ok && result.qr) {
			this.qrData = result.qr;
		} else {
			this.queueTwoFaMessage(this.getTwoFaErrorPayload(result.status, "setup"));
		}
		this.renderAndBind();
	}

	private submitCodeIfValid(): void {
		const input = this.querySelector<HTMLInputElement>("#twofa-code");
		const code = (input?.value || "").trim();
		if (!/^[0-9]{6}$/.test(code)) {
			messages.twoFaMessage("enable", false, this.messageHostSelector, {
				titleKey: "common_error",
				messageKey: "user_store_twofa_code_invalid"
			});
			input?.focus();
			return;
		}
		this.handleVerify(code);
	}

	private handleVerify(code: string): void {
		enable2Fa(code).then((result) => {
			if (result.ok) {
				this.qrData = null;
				this.queueTwoFaMessage({ status: "enable", success: true });
				this.renderAndBind();
				setTimeout(() => router.navigate("/settings/security"), 2000);
			} else {
				this.queueTwoFaMessage(this.getTwoFaErrorPayload(result.status, "enable"));
				this.renderAndBind();
			}
		});
	}

	private handleDisable(): void {
		disable2FA().then((result) => {
			if (result.ok) {
				this.qrData = null;
				this.queueTwoFaMessage({ status: "disable", success: true });
				this.renderAndBind();
				setTimeout(() => router.navigate("/settings/security"), 2000);
			} else {
				this.queueTwoFaMessage(this.getTwoFaErrorPayload(result.status, "disable"));
				this.renderAndBind();
			}
		});
	}

	private queueTwoFaMessage(payload: { status: "enable" | "disable"; success: boolean; override?: { titleKey?: string; messageKey?: string; icon?: string; theme?: string } }): void {
		this.pendingMessage = payload;
	}

	private getTwoFaErrorPayload(status: number, stage: "setup" | "enable" | "disable"): { status: "enable" | "disable"; success: boolean; override?: { titleKey?: string; messageKey?: string; icon?: string; theme?: string } } {
		const statusKey = stage === "disable" ? "disable" : "enable";
		if (status === 401) {
			if (stage === "enable") {
				return {
					status: "enable",
					success: false,
					override: {
						titleKey: "twofa_enable_error_title",
						messageKey: "twofa_enable_error_message",
						icon: "⚠️"
					}
				};
			}
			return {
				status: statusKey,
				success: false,
				override: {
				titleKey: "twofa_error_unauthorized_title",
				messageKey: "twofa_error_unauthorized_message",
				icon: "🔒"
				}
			};
		}

		if (status === 0) {
			return {
				status: statusKey,
				success: false,
				override: {
					titleKey: "network_error_title",
					messageKey: "network_error_unreachable"
				}
			};
		}

		if (stage === "setup") {
			return {
				status: "enable",
				success: false,
				override: {
					titleKey: "twofa_setup_error_title",
					messageKey: "twofa_setup_error_message"
				}
			};
		}

		return { status: statusKey, success: false };
	}

	private adjustMainContentMargin(isCollapsed: boolean): void {
		const main = this.querySelector(".main-content");
		if (!main) return;
		const transitionClasses = sidebarStateManager.getTransitionClasses();
		main.classList.add(...transitionClasses);
		main.classList.toggle("ml-72", !isCollapsed);
		main.classList.toggle("ml-16", isCollapsed);
	}
}

customElements.define("twofa-auth", TwoFaAuth);
export default TwoFaAuth;
