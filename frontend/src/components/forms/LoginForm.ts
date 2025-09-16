import { UserForm } from "./UserForm";
import { router } from "../../router/Router";
import messages from "../Messages";
import { setUser } from "../../store/UserStore";

type UserLogin = {
	email?: string;
	username?: string;
	password: string;
}

class LoginForm extends UserForm{

	// Login'e özel error mapping'i override ediyoruz
	protected errorMappings = {
		400: {
			title: "Geçersiz Bilgi",
			message: "Girdiğiniz bilgilerde bir hata var. Lütfen tüm alanları doğru şekilde doldurup tekrar deneyin."
		},
		401: {
			title: "Giriş Başarısız",
			message: "E-posta/kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin."
		},
		404: {
			title: "Kullanıcı Bulunamadı",
			message: "Bu e-posta/kullanıcı adı ile kayıtlı bir hesap bulunamadı. Kayıt olmayı deneyin."
		},
		500: {
			title: "Sistemsel Hata",
			message: "Sunucuda teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
		}
	};

	private handleGoogleLogin(): void {
		// Google OAuth işlemi burada yapılacak
		// Örneğin: window.location.href = "http://localhost:3000/auth/google"
		console.log("Google OAuth işlemi başlatılıyor...");
		// veya
		// window.open("http://localhost:3000/auth/google", "_self");
	}

	protected setupEvents(): void {
		super.setupEvents(); 

		const googleButton = this.querySelector("#googleButton") as HTMLButtonElement;
		googleButton?.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleGoogleLogin();
		});

		const signupLink = this.querySelector("#signupLink") as HTMLAnchorElement;
		signupLink?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/signup");
		});

		const headerSection = this.querySelector("#headerSection") as HTMLDivElement;
		headerSection?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/");
		});
		
	}
	protected async handleSubmit(e: Event): Promise<void> {
		e.preventDefault();
		const formData = new FormData(this.form);
		
		// Email veya kullanıcı adı boş olamaz - XSS güvenliği ile
		const emailOrUsername = this.sanitizeInput(formData.get("emailOrUsername") as string || "");
		if (!emailOrUsername) {
			messages.showMessage("Hata", "Lütfen e-posta veya kullanıcı adı girin.", "error", ".p-8");
			return;
		}
		
		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/; 
		if (!this.checkInput(passwordPattern, '#password', 'label[for="password"]', 'Şifre'))
			return;

		const userData: UserLogin = {
			email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
			username: emailOrUsername.includes('@') ? undefined : emailOrUsername,
			password: this.sanitizeInput(formData.get("password") as string || ""),
		};

		fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(userData),
			credentials: 'include' 
		})
		.then(response => {
			return response.text().then(text => ({
				status: response.status,
				ok: response.ok,
				data: text ? JSON.parse(text) : {}
			}));
		})
		.then(({ status, ok, data }) => {
			if (ok) {
				this.handleSuccessfulLogin(data);
			} else {
				this.handleApiError(status);
			}
		})
		.catch(error => {
			console.error('Network error:', error);
			this.handleNetworkError(error);
		});
	}

	private handleSuccessfulLogin(data: any): void {
		if (!data.success) {
			const errorMessage = typeof data.message === 'string' 
				? data.message.slice(0, 200) 
				: "Giriş işlemi başarısız. Bilgilerinizi kontrol edin.";
			
			messages.showMessage("Giriş Başarısız", errorMessage, "error", ".p-8");
			return;
		}

		if (!data.user || typeof data.user !== 'object') {
			messages.showMessage("Hata", "Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.", "error", ".p-8");
			return;
		}

		messages.showLoadingAnimation(".p-8");
		
		const userSetSuccess = setUser(data.user);
		if (!userSetSuccess) {
			messages.showMessage("Hata", "Kullanıcı verisi işlenirken hata oluştu.", "error", ".p-8");
			return;
		}

		setTimeout(() => {
			router.navigate("/");
		}, 5000);
	}

	private handleNetworkError(error: any): void {
		let userMessage = "Bilinmeyen bir hata oluştu.";
		
		if (error instanceof TypeError && error.message.includes('fetch')) {
			userMessage = "İnternet bağlantınızı kontrol edin ve tekrar deneyin.";
		} else if (error instanceof Error) {
			if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
				userMessage = "Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.";
			} else if (error.message.includes('timeout')) {
				userMessage = "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
			} else {
				userMessage = "Bağlantı hatası oluştu. Lütfen tekrar deneyin.";
			}
		}
		
		messages.showMessage("Bağlantı Hatası", userMessage, "error", ".p-8");
	}
	protected createForm(): string {
		return(`
			<section class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<div class="flex flex-col items-center justify-center px-4 py-6 mx-auto min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))">
					<!-- Logo ve Başlık Bölümü -->
					<div id="headerSection" class="flex flex-col items-center mb-6 md:mb-8 text-center cursor-pointer hover:scale-105 transition-transform duration-300">
						<div class="flex items-center mb-3 md:mb-4">
							<img class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mr-3 md:mr-4 drop-shadow-2xl" src="/pong.png" alt="logo">
							<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl tracking-wide">
								Ft_Transcendance
							</h1>
						</div>
						<p class="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-lg font-light max-w-sm md:max-w-md">
							Efsanevi Pong oyununa hoş geldiniz
						</p>
					</div>
					<div class="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-lg shadow-xl border border-white/20">
						<div class="p-6 sm:p-7 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
							<h2 class="text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white text-center">
								Hesabınıza Giriş Yapın
							</h2>
							<form class="space-y-4 sm:space-y-5 md:space-y-6" action="#">
								<div>
									<label for="emailOrUsername" class="block mb-2 text-sm sm:text-base font-medium text-gray-900 dark:text-white">E-posta veya Kullanıcı Adı</label>
									<input type="text" name="emailOrUsername" id="emailOrUsername" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-sm sm:text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:p-3.5 md:p-4 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="E-posta veya Kullanıcı Adı" required>
								</div>
								<div>
									<label for="password" class="block mb-2 text-sm sm:text-base font-medium text-gray-900 dark:text-white">Şifre</label>
									<input type="password" name="password" id="password" placeholder="••••••••" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-sm sm:text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:p-3.5 md:p-4 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" required="">
								</div>
								<div class="flex items-center justify-between">
									<div class="flex items-start">
										<div class="flex items-center h-5">
											<input id="remember" name="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-white/50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700/70 dark:border-gray-600 dark:focus:ring-blue-600">
										</div>
										<div class="ml-3 text-sm sm:text-base">
											<label for="remember" class="text-gray-700 dark:text-gray-300">Beni Hatırla</label>
										</div>
									</div>
								</div>
								<button type="submit" class="w-full text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm sm:text-base px-5 py-3 sm:py-3.5 md:py-4 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">Giriş Yap</button>
								
								<!-- Google Sign In Button -->
								<button 
									type="button"
									id="googleButton" 
									class="w-full text-gray-900 dark:text-white bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-600/80 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm sm:text-base px-5 py-3 sm:py-3.5 md:py-4 text-center inline-flex items-center justify-center backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
									<svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									Google ile Giriş Yap
								</button>
								
								<p class="text-sm sm:text-base font-light text-gray-600 dark:text-gray-300 text-center">
									Henüz hesabınız yok mu? 
									<a
										id="signupLink"
										href="/signup" 
										class="font-medium text-white bg-blue-900 hover:bg-blue-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:underline transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-block text-sm sm:text-base">Kayıt Ol</a>
								</p>
							</form>
						</div>
					</div>
				</div>
			</section>
			`)
	}
	

}
customElements.define("login-form", LoginForm);
