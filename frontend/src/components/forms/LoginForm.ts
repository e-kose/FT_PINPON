import { UserForm } from "./UserForm";
import { fillIndex } from "../../router/ReWriteInHtml";
import SuccesForm from "../succes/SuccesMessage";

interface UserLogin {
	emailOrUsername: string;
	password: string;
}

class LoginForm extends UserForm{
	protected createForm(): string {
		return(`
			<section class="bg-gray-50 dark:bg-gray-900">
  <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
	  <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
		  <img class="w-8 h-8 mr-2" src="/pong.png" alt="logo">
		  Ft_Transcendance    
	  </a>
	  <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-lg xl:p-0 dark:bg-gray-800 dark:border-gray-700">
		  <div class="p-8 space-y-6 md:space-y-8 sm:p-10">
			  <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
				  Hesabınıza Giriş Yapın
			  </h1>
			  <form class="space-y-6 md:space-y-8" action="#">
				  <div>
					  <label for="emailOrUsername" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">E-posta veya Kullanıcı Adı</label>
					  <input type="text" name="emailOrUsername" id="emailOrUsername" class="bg-gray-50 border border-blue-900 text-gray-900 text-sm rounded-lg focus:ring-blue-900 focus:border-blue-900 block w-full p-2.5 dark:bg-gray-700 dark:border-blue-900 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900" placeholder="E-posta veya Kullanıcı Adı" required="">
				  </div>
				  <div>
					  <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Şifre</label>
					  <input type="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-blue-900 text-gray-900 text-sm rounded-lg focus:ring-blue-900 focus:border-blue-900 block w-full p-2.5 dark:bg-gray-700 dark:border-blue-900 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900" required="">
				  </div>
				  <div class="flex items-center justify-between">
					  <div class="flex items-start">
						  <div class="flex items-center h-5">
							  <input id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800">
						  </div>
						  <div class="ml-3 text-sm">
							  <label for="remember" class="text-gray-500 dark:text-gray-300">Beni Hatırla</label>
						  </div>
					  </div>
				  </div>
				  <button type="submit" class="w-full text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-900 dark:hover:bg-blue-800 dark:focus:ring-blue-800">Giriş Yap</button>
				  
				  <!-- Google Sign In Button -->
				  <button type="button" class="w-full text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700">
					  <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
						  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					  </svg>
					  Google ile Giriş Yap
				  </button>
				  
				  <p class="text-sm font-light text-gray-500 dark:text-gray-400">
					  Henüz hesabınız yok mu? <a href="#" class="font-medium text-white bg-blue-900 hover:bg-blue-800 px-2 py-1 rounded hover:underline dark:bg-blue-900 dark:hover:bg-blue-800">Kayıt Ol</a>
				  </p>
			  </form>
		  </div>
	  </div>
  </div>
</section>
			`)
	}
	protected async handleSubmit(e: Event): Promise<void> {
		e.preventDefault();
		const formData = new FormData(this.form);
		const userData: UserLogin = {
			emailOrUsername: formData.get("emailOrUsername") as string,
			password: formData.get("password") as string,
		};
		
		try {
			const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData)
			})
			.then(res => {
				if (res.ok) {
					return res.json();
				} else {
					throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				}
			})
			.then(data => {
				const succesForm = new SuccesForm();
				if (data.success) {
					fillIndex(succesForm.userRegister("Giriş Başarılı", "Başarıyla giriş yaptınız, ana sayfaya yönlendiriliyorsunuz."));
					// 2 saniye sonra ana sayfaya yönlendir
					setTimeout(() => {
						fillIndex("<Home> </Home>");
					}, 2000);
				} else {
					fillIndex(succesForm.userRegister("Giriş Başarısız", data.message));
				}
			})
			.catch(error => {
				console.error('Login error:', error);
				const succesForm = new SuccesForm();
				fillIndex(succesForm.userRegister("Hata", "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin."));
			});
		} catch (error) {
			console.error('Network error:', error);
			const succesForm = new SuccesForm();
			fillIndex(succesForm.userRegister("Ağ Hatası", "Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin."));
		}
	}
	
}
customElements.define("login-form", LoginForm);
