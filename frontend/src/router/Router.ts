import "../components/errors/ErrorPages";
import "../components/forms/SignupForm";
import "../components/forms/UserForm";
import "../components/Dashboard";
import "../components/sideBarComponents/Settings";

class Router
{
	private routes: { path: string; component: string }[] = [];
	
	public addRoute(path: string, component: string): void {
		this.routes.push({ path, component });
	}

	// Error routing helper methods
	public navigateToError(errorType: '404' | '500' | '403' | '401' | 'auth'): void {
		this.navigate(`/error/${errorType}`);
	}

	public navigateTo404(): void {
		this.navigateToError('404');
	}

	public navigateTo500(): void {
		this.navigateToError('500');
	}

	public navigateTo403(): void {
		this.navigateToError('403');
	}

	public navigateTo401(): void {
		this.navigateToError('401');
	}

	public navigateToAuthError(): void {
		this.navigateToError('auth');
	}
	private handleRoute(path: string | null): void 
	{
		if (path) {
			if (window.location.pathname !== path) {
				window.history.pushState({ path }, '', path);
			} else {
				window.history.replaceState({ path }, '', path);
			}
		}
	}
	public navigate(path: string): void 
	{
		const previouesPath = window.location.pathname;
		const app = document.getElementById("app");
		const route = this.routes.find(r => r.path === path);
		console.log("Navigating to:", path);
		if (route) {
			!((previouesPath === "/signup" || previouesPath === "/login") && path === "/") ? this.handleRoute(path) : window.history.replaceState(null, '', path);
			fillIndex(route.component, app);
		} else {
			this.handleRoute('/error/404');
			fillIndex('<error-page error-type="404" error-title="Sayfa Bulunamadı" error-description="Aradığınız sayfa mevcut değil veya taşınmış olabilir."></error-page>', app);
		}
	}
};


function stringToHTMLElement(htmlString: string): HTMLElement {
	// CSP-safe HTML parsing
	const template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	const element = template.content.firstElementChild as HTMLElement;
	return element || document.createElement('div');
}

function fillIndex(htmlValue: string, app: HTMLElement | null): void {
	if (app) {
		app.innerHTML = "";
		htmlValue ? app.appendChild(stringToHTMLElement(htmlValue)) : app.appendChild(stringToHTMLElement('<error-page error-type="500" error-title="Beklenmeyen Hata" error-description="Bir şeyler ters gitti."></error-page>'));
	}
	else{
		throw new Error("Error: root is undefined");
	}
}


const router = new Router();
addEventListener('popstate', (event) => {
	const path = (event.state && event.state.path) ? event.state.path : window.location.pathname;
	router.navigate(path);
});

function initializeRouter(): void {
	// Ana sayfa route'ları
	router.addRoute('/', '<dashboard-component></dashboard-component>');
	router.addRoute('/signup', '<signup-form></signup-form>');
	router.addRoute('/login', '<login-form></login-form>');
	router.addRoute('/settings', '<settings-component></settings-component>');
	
	// Error page route'ları
	router.addRoute('/error/404', '<error-page error-type="404" error-title="Sayfa Bulunamadı" error-description="Aradığınız sayfa mevcut değil veya taşınmış olabilir."></error-page>');
	router.addRoute('/error/500', '<error-page error-type="500" error-title="Sunucu Hatası" error-description="Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin."></error-page>');
	router.addRoute('/error/403', '<error-page error-type="403" error-title="Erişim Reddedildi" error-description="Bu sayfaya erişim yetkiniz bulunmuyor."></error-page>');
	router.addRoute('/error/401', '<error-page error-type="401" error-title="Giriş Gerekli" error-description="Bu sayfayı görüntülemek için giriş yapmanız gerekiyor."></error-page>');
	router.addRoute('/error/auth', '<error-page error-type="auth" error-title="Kimlik Doğrulama Hatası" error-description="Giriş bilgilerinizde bir sorun var. Lütfen tekrar giriş yapın."></error-page>');
	
	// Genel error route'u (fallback)
	router.addRoute('/error', '<error-page error-type="500" error-title="Bir Hata Oluştu" error-description="Lütfen daha sonra tekrar deneyin."></error-page>');
	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a');
		
		if (link && link.href && !link.href.startsWith('http') && !link.href.includes('://')) {
			e.preventDefault();
			const path = new URL(link.href).pathname;
			router.navigate(path);
		}
	});
	router.navigate(window.location.pathname);
}

export { fillIndex, router, initializeRouter };