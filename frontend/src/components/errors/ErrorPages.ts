
import { router } from "../../router/Router";

class ErrorPages extends HTMLElement {
	private errorType: string = '404';
	private errorTitle: string = 'Sayfa Bulunamadı';
	private errorDescription: string = 'Aradığınız sayfa mevcut değil.';

	constructor() {
		super();
		this.render();
	}

	connectedCallback(): void {
		this.setupEvents();
	}

	disconnectedCallback(): void {
		// Event cleanup
	}

	// Attributes to properties
	static get observedAttributes() {
		return ['error-type', 'error-title', 'error-description'];
	}

	attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
		switch (name) {
			case 'error-type':
				this.errorType = newValue || '404';
				break;
			case 'error-title':
				this.errorTitle = newValue || 'Sayfa Bulunamadı';
				break;
			case 'error-description':
				this.errorDescription = newValue || 'Aradığınız sayfa mevcut değil.';
				break;
		}
		this.render();
	}

	private render(): void {
		this.innerHTML = `
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
				<div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))">
					<div class="max-w-md w-full mx-auto p-8">
						<!-- Error Card -->
						<div class="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl p-12 text-center shadow-2xl border border-white/20">
							<!-- Error Icon & Code -->
							<div class="mb-8">
								<div class="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/50 rounded-full mb-6">
									<span class="text-4xl">${this.getErrorIcon()}</span>
								</div>
								<h1 class="text-6xl font-bold text-red-600 dark:text-red-400 mb-4 tracking-tight">
									${this.errorType}
								</h1>
							</div>

							<!-- Error Content -->
							<div class="mb-8">
								<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
									${this.errorTitle}
								</h2>
								<p class="text-gray-600 dark:text-gray-300 leading-relaxed">
									${this.errorDescription}
								</p>
							</div>

							<!-- Action Buttons -->
							<div class="space-y-4">
								<button id="goHomeBtn" class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
									<span class="mr-2">🏠</span>
									Ana Sayfaya Dön
								</button>
								
								<button id="goBackBtn" class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-6 rounded-xl transition-all duration-200 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transform hover:scale-105">
									<span class="mr-2">⬅️</span>
									Geri Git
								</button>
							</div>

							<!-- Additional Help -->
							<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
								<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
									Sorun devam ediyorsa:
								</p>
								<button id="contactSupportBtn" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm underline transition-colors">
									Destek ekibine ulaşın
								</button>
							</div>
						</div>

						<!-- Fun Facts Section -->
						<div class="mt-8 bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl p-6 text-center border border-white/20">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
								<span class="mr-2">🎮</span>
								Bil Bakalım!
							</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
								${this.getRandomFact()}
							</p>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	private setupEvents(): void {
		// Home button
		const goHomeBtn = this.querySelector('#goHomeBtn');
		goHomeBtn?.addEventListener('click', () => {
			router.navigate('/');
		});

		// Back button
		const goBackBtn = this.querySelector('#goBackBtn');
		goBackBtn?.addEventListener('click', () => {
			window.history.back();
		});

		// Contact support button
		const contactSupportBtn = this.querySelector('#contactSupportBtn');
		contactSupportBtn?.addEventListener('click', () => {
			// TODO: Open support modal or redirect to support page
			alert('Destek sayfası yakında açılacak!');
		});
	}

	private getErrorIcon(): string {
		switch (this.errorType) {
			case '404':
				return '🔍';
			case '500':
				return '⚠️';
			case '403':
				return '🚫';
			case '401':
				return '🔒';
			default:
				return '❌';
		}
	}

	private getRandomFact(): string {
		const facts = [
			'Pong, 1972 yılında piyasaya çıkan ilk ticari video oyunlarından biridir!',
			'Orijinal Pong oyunu sadece iki çubuk ve bir top içeriyordu.',
			'Pong\'un yaratıcısı Allan Alcorn, sadece bir alıştırma projesi olarak yapmıştı.',
			'İlk Pong makinesi Chuck E. Cheese\'de test edilmişti.',
			'Pong o kadar popülerdi ki makineler bozulmadan önce coin\'lerle dolup taşıyordu!'
		];
		return facts[Math.floor(Math.random() * facts.length)];
	}

	// Public methods for setting error details
	public setError(type: string, title: string, description: string): void {
		this.errorType = type;
		this.errorTitle = title;
		this.errorDescription = description;
		this.render();
	}

	// Static error configurations
	public static getErrorConfig(type: string) {
		const configs = {
			'404': {
				title: 'Sayfa Bulunamadı',
				description: 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.'
			},
			'500': {
				title: 'Sunucu Hatası',
				description: 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
			},
			'403': {
				title: 'Erişim Reddedildi',
				description: 'Bu sayfaya erişim yetkiniz bulunmuyor.'
			},
			'401': {
				title: 'Giriş Gerekli',
				description: 'Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.'
			},
			'auth': {
				title: 'Kimlik Doğrulama Hatası',
				description: 'Giriş bilgilerinizde bir sorun var. Lütfen tekrar giriş yapın.'
			}
		};
		return configs[type as keyof typeof configs] || configs['404'];
	}
}

customElements.define("error-page", ErrorPages);

export default ErrorPages;



