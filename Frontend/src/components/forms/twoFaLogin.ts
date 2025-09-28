import { router } from '../../router/Router';
import { loginAuth } from '../../store/AuthService';
import { getUserLoginData, submitCodeIfValid, setUserLoginData, setUser } from '../../store/UserStore';
import messages from '../utils/Messages';
import { UserForm } from './UserForm';


class TwoFaLogin extends UserForm {
	private isSubmitting = false;

	protected errorMappings: Record<number, { title: string; message: string; }> = 
	{
		400: { title: 'Geçersiz Kod', message: 'Girilen 2FA kodu geçersiz.' },
		401: { title: 'Yetkilendirme Hatası', message: 'Kod süresi dolmuş olabilir.' },
		403: { title: 'Erişim Engellendi', message: 'Çok fazla yanlış deneme yapıldı.' },
		404: { title: 'Kullanıcı Bulunamadı', message: 'Oturum süresi dolmuş.' },
		429: { title: 'Çok Fazla Deneme', message: 'Lütfen biraz bekleyip tekrar deneyin.' },
		500: { title: 'Sunucu Hatası', message: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
	};

	connectedCallback(): void {
		// Render form content
		console.log("TwoFaLogin connectedCallback");
		this.innerHTML = this.createForm();
		this.form = this.querySelector('form') as HTMLFormElement;
		this.setupEvents(); // adds submit listener
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
			// email keyini kaldır
			delete updated.email;
			setUserLoginData(updated);
			console.log("User Dataa 2FA----->", getUserLoginData());
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
				// Başarılı veya hatalı durumda ikinci istekleri engellemek için kilidi aç
				this.isSubmitting = false;
			}).catch((error) => {
				console.error("2FA Login error:", error);
				this.handleApiError(500, '#inline-msg');
				this.isSubmitting = false;
			});
		} else {
			this.isSubmitting = false;
		}
	}
	protected createForm(): string {
		return `
		<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
			<form class="w-full max-w-sm sm:max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-8 relative overflow-hidden">
				<div class="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
				<div class="relative z-10 space-y-6">
					<div class="text-center space-y-2">
						<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">2FA Doğrulaması</h1>
						<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">6 haneli kodu gir.</p>
					</div>
					<div class="flex flex-col items-center gap-5">
						<div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md ring-4 ring-indigo-500/10">🔐</div>
						<div class="w-full flex flex-col items-center gap-3">
							<label for="login-2fa-code" class="text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">Kod</label>
							<input id="login-2fa-code" type="text" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" class="w-48 text-center text-xl font-mono tracking-[0.35em] px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 transition" />
							<p class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>Kod yenilenir ~30sn</p>
						</div>
						<div class="flex flex-col gap-2 w-full max-w-xs">
							<button type="submit" data-action="submit" class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-60">Doğrula</button>
							<button data-action="cancel" class="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-[11px] font-medium transition">İptal</button>
						</div>
						<div id="inline-msg" class="w-full text-center min-h-[32px]"></div>
					</div>
				</div>
			</form>
		</div>`
	}
	
}

customElements.define('twofa-login', TwoFaLogin);
export default TwoFaLogin;

