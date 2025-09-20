import { UserForm } from "./UserForm"
import { router } from "../../router/Router";
import messages from "../Messages";
import "./LoginForm";

interface UserSignup {
	email: string;
  username: string;
  password: string;
}

export default class SignupForm extends UserForm 
{
	// Signup'a özel error mapping'i override ediyoruz
	protected errorMappings = {
		400: {
			title: "Geçersiz Veri",
			message: "Girdiğiniz bilgilerde bir hata var. Lütfen tüm alanları doğru şekilde doldurup tekrar deneyin."
		},
		409: {
			title: "Kullanıcı Zaten Mevcut",
			message: "Bu e-posta adresi ile zaten bir hesap var. Giriş yapmayı deneyin."
		},
		500: {
			title: "Sistemsel Hata",
			message: "Sunucuda teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
		}
	};

	protected setupEvents(): void {
		super.setupEvents(); // sbmti butonunu bağladım
		
		const googleButton = this.querySelector("#googleButton") as HTMLButtonElement;
		googleButton?.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleGoogleAuth();
		});

		const loginLink = this.querySelector("#loginLink") as HTMLAnchorElement;
		loginLink?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/login");
		});

		const headerSection = this.querySelector("#headerSection") as HTMLDivElement;
		headerSection?.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/");
		});
	}

	// private handleGoogleLogin(): void {
	// 	// Google OAuth işlemi burada yapılacak
	// 	// Örneğin: window.location.href = "http://localhost:3000/auth/google"
	// 	console.log("Google OAuth işlemi başlatılıyor...");
	// 	// veya
	// 	// window.open("http://localhost:3000/auth/google", "_self");
	// }

	protected handleSubmit(e: Event): void {
		e.preventDefault();
		const formData = new FormData(this.form);
		
		// XSS güvenliği ile input sanitization
		const userData: UserSignup = {
			email: this.sanitizeInput(formData.get("email") as string || ""),
			username: this.sanitizeInput(formData.get("username") as string || ""),
			password: this.sanitizeInput(formData.get("password") as string || ""),
		};
			
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
		if (!this.checkInput(emailPattern, '#email', 'label[for="email"]', 'E-posta'))
			return;
		
		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/; 
		if (!this.checkInput(passwordPattern, '#password', 'label[for="password"]', 'Şifre'))
			return;

		fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},	
			body: JSON.stringify(userData)
		})
		.then(res => {
			return res.text().then(text => ({
				status: res.status,
				ok: res.ok,
				data: text ? JSON.parse(text) : {}
			}));
		})
		.then(({ status, ok, data }) => {
			if (ok) {
				this.handleSuccessfulRegistration(data);
			} else {
				this.handleApiError(status);
			}
		})
		.catch(error => {
			console.error('Registration error:', error);
			this.handleNetworkError(error);
		});
	}

	private handleSuccessfulRegistration(data: any): void {
		if (!data.success) {
			const errorMessage = typeof data.message === 'string' 
				? data.message.slice(0, 200) 
				: "Kayıt işlemi başarısız oldu.";
			
			messages.showMessage("Kayıt Başarısız", errorMessage, "error", "#messageContainer");
			return;
		}
		messages.showMessage("Başarılı", "Kayıt işleminiz başarıyla tamamlandı. Giriş Ekranına Yönlendiriliyorsunuz...", "success", "#messageContainer");
		setTimeout(() => {
			router.navigate("/login");
		}, 2000);
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
		
		messages.showMessage("Bağlantı Hatası", userMessage, "error", "#messageContainer");
	}
	
	protected createForm(): string {
		return (`
			<section class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<div class="flex flex-col items-center justify-center px-4 py-6 mx-auto min-h-screen" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))">
					<!-- Logo ve Başlık Bölümü -->
					<div id="headerSection" class="flex flex-col items-center mb-6 md:mb-8 text-center cursor-pointer hover:scale-105 transition-transform duration-300">
						<div class="flex flex-col sm:flex-row items-center mb-3 md:mb-4">
							<img class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-2 sm:mb-0 sm:mr-3 md:mr-4 drop-shadow-2xl" src="/pong.png" alt="logo">
							<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl tracking-wide text-center sm:text-left">
								Ft_Transcendance
							</h1>
						</div>
						<p class="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-lg font-light max-w-sm md:max-w-md">
							Efsanevi Pong dünyasına katılın
						</p>
					</div>
					<div class="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-lg shadow-xl border border-white/20">
						<div class="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
							<h2 class="text-base sm:text-lg md:text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white text-center">
								Hesap Oluştur
							</h2>
							<form class="space-y-3 sm:space-y-4 md:space-y-5" action="#">
								<div>
									<label for="username" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Kullanıcı Adı</label>
									<input type="text" name="username" id="username" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="Kullanıcı Adı" required="">
								</div>
								<div>
									<label for="email" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">E-posta</label>
									<input type="email" name="email" id="email" title="Geçerli bir email adresi girin (örn: test@example.com)" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" placeholder="example@example.com" required="">
								</div>
								<div>
									<label for="password" class="block mb-1.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Şifre</label>
									<input type="password" name="password" id="password" placeholder="En az 1 büyük, 1 küçük harf ve 1 rakam" class="bg-white/50 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-3 backdrop-blur-sm placeholder-gray-600 dark:placeholder-gray-400" required="">
								</div>
								<button type="submit" class="w-full text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 sm:py-3 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">Hesap Oluştur</button>
								
								<!-- Google Sign Up Button -->
								<button 
									type="button"
									id="googleButton" 
									class="w-full text-gray-900 dark:text-white bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-600/80 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-4 py-2.5 sm:py-3 text-center inline-flex items-center justify-center backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
									<svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									<span class="hidden sm:inline">Google ile bağlan</span>
									<span class="sm:hidden">Google</span>
								</button>
								
								<p class="text-xs sm:text-sm font-light text-gray-600 dark:text-gray-300 text-center">
									Zaten hesabınız var mı? 
									<a 
										id="loginLink"
										href="/login" 
										class="font-medium text-white bg-blue-900 hover:bg-blue-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:underline transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-block text-xs sm:text-sm">Buradan Giriş Yapın</a>
								</p>
								
								<!-- Mesaj Container - Formun içinde en altta -->
								<div id="messageContainer" class="mt-3"></div>
							</form>
						</div>
					</div>
				</div>
			</section>
			`);
	}

	
}
customElements.define("signup-form", SignupForm);
