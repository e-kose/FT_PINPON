import { UserForm } from "./UserForm"
import { navigateTo } from "../../router/Router.ts";
import "./LoginForm.ts"
interface UserSignup {
	email: string;
  username: string;
  password: string;
}

class SignupForm extends UserForm 
{
	protected setupEvents(): void {
		super.setupEvents(); // sbmti butonunu bağladım
		
		const googleButton = this.querySelector("#googleButton") as HTMLButtonElement;
		googleButton?.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleGoogleLogin();
		});

		const loginLink = this.querySelector("#loginLink") as HTMLAnchorElement;
		loginLink?.addEventListener("click", (e) => {
			e.preventDefault();
			navigateTo("/login", "<login-form> </login-form>");
		});
	}

	private handleGoogleLogin(): void {
		// Google OAuth işlemi burada yapılacak
		// Örneğin: window.location.href = "http://localhost:3000/auth/google"
		console.log("Google OAuth işlemi başlatılıyor...");
		// veya
		// window.open("http://localhost:3000/auth/google", "_self");
	}

	protected async handleSubmit(e: Event): Promise<void> 
	{
		e.preventDefault();
		const formData = new FormData(this.form);
		const userData: UserSignup = {
			email: formData.get("email") as string,
			username: formData.get("username") as string,
			password: formData.get("password") as string,
		};
		
		const checkInput = (rule : RegExp, inputElement:string, labelElement: string, labelText: string): boolean =>{
			const input = this.querySelector(inputElement) as HTMLInputElement;
			const label = this.querySelector(labelElement) as HTMLLabelElement;
			if (!rule.test(input.value)) {
				label.innerHTML = `${labelText} <span class="text-red-500 text-xs">(Geçerli bir değer girin)</span>`;
				label.classList.add('text-red-500');
				
				const handleInput = () => {
					if (rule.test(input.value)) {
						label.innerHTML = labelText;
						label.classList.remove('text-red-500');
						input.removeEventListener('input', handleInput);
					}
				};
				input.addEventListener('input', handleInput);
				return false;
			}
			return true;
		}
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
		if (!checkInput(emailPattern, '#email', 'label[for="email"]', 'E-posta'))
				return;
		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/; 
		if (!checkInput(passwordPattern, '#password', 'label[for="password"]', 'Şifre'))
			return;

		try {
			 await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},	
				body: JSON.stringify(userData)
			})
			.then(res => {
				if (res.ok)
				return res.ok ? res.json() : Promise.reject(new Error('Registration failed'));
			})
			.then(data => {
				console.log(data);
				if (data.success) {
					this.showMessage("Başarılı","Kayıt işleminiz başarıyla tamamlandı. Giriş Ekranına Yönlendiriliyorsunuz...", "success");
					setTimeout(() => {
						navigateTo("/login", "<login-form> </login-form>");
					}, 5000);
				} else {
					console.log("false: ", data.message);
					this.showMessage("Hata",data.message || "Kayıt işlemi başarısız.", "error");
				}
			})
			.catch(error => {
				alert("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin!\n" + error.message);
			});
		} catch (error) {
			alert("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
		}
	}
	
	protected createForm(): string {
		return (`
			<section class="bg-gray-50 dark:bg-gray-900">
  <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          <img class="w-8 h-8 mr-2" src="/pong.png" alt="logo">
          Ft_Transcendance    
      </a>
      <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-lg xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div class="p-8 space-y-6 md:space-y-8 sm:p-10">
              <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                  Hesap Oluştur
              </h1>
              <form class="space-y-6 md:space-y-8" action="#">
                  <div>
                      <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Kullanıcı Adı</label>
                      <input type="text" name="username" id="username" class="bg-gray-50 border border-blue-900 text-gray-900 text-sm rounded-lg focus:ring-blue-900 focus:border-blue-900 block w-full p-2.5 dark:bg-gray-700 dark:border-blue-900 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900" placeholder="Kullanıcı Adı" required="">
                  </div>
                  <div>
                      <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">E-posta</label>
                      <input type="email" name="email" id="email" title="Geçerli bir email adresi girin (örn: test@example.com)" class="bg-gray-50 border border-blue-900 text-gray-900 text-sm rounded-lg focus:ring-blue-900 focus:border-blue-900 block w-full p-2.5 dark:bg-gray-700 dark:border-blue-900 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900" placeholder="ornek@example.com" required="">
                  </div>
                  <div>
                      <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Şifre</label>
                      <input type="password" name="password" id="password" placeholder="En az 1 büyük, 1 küçük harf ve 1 rakam" class="bg-gray-50 border border-blue-900 text-gray-900 text-sm rounded-lg focus:ring-blue-900 focus:border-blue-900 block w-full p-2.5 dark:bg-gray-700 dark:border-blue-900 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-900 dark:focus:border-blue-900" required="">
                  </div>
                  <button type="submit" class="w-full text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-900 dark:hover:bg-blue-800 dark:focus:ring-blue-800">Hesap Oluştur</button>
                  
                     <!-- Google Sign Up Button -->
                  <button 
					type="button"
					id="googleButton" 
					class="w-full text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700">
                      <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google ile Kayıt Ol
                  </button>
                  
                  <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                      Zaten hesabınız var mı? 
					  <a 
					  	id="loginLink"
					  	href="/login" 
						class="font-medium text-white bg-blue-900 hover:bg-blue-800 px-2 py-1 rounded hover:underline dark:bg-blue-900 dark:hover:bg-blue-800">Buradan Giriş Yapın</a>
                  </p>
              </form>
          </div>
      </div>
  </div>
</section>
			`);
	}

	private showMessage(status: string, message: string, msgType: string): void {
		
		const messageDiv = document.createElement('div');
		const msgClass = msgType === "error" ? 'mt-4 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-700' : 'mt-4 bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-700';
		messageDiv.className = msgClass;
		messageDiv.innerHTML = `
			<div class="flex items-center">
				<svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
				</svg>
				<p class="text-green-800 dark:text-green-200 font-medium">${status} !</p>
			</div>
			<p class="text-green-700 dark:text-green-300 mt-2">${message}</p>
		`;
		
		const formContainer = this.querySelector('.p-8');
		if (formContainer) {
			formContainer.appendChild(messageDiv);
		}
	}	
}
customElements.define("signup-form", SignupForm);
