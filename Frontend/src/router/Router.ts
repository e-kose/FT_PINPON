import "../components/errors/ErrorPages";
import "../components/forms/SignupForm";
import "../components/forms/UserForm";
import "../components/sideBarComponents/Dashboard";
import "../components/utils/MyProfile";
import "../components/utils/TwoFaAuth";
import "../components/forms/TwoFaLogin";
import "../components/sideBarComponents/Settings/Settings";
import "../components/sideBarComponents/Play";
import "../components/sideBarComponents/Game/Game";
import "../components/sideBarComponents/Friends";
import "../components/sideBarComponents/FriendProfile";
import "../components/sideBarComponents/Chat";


class Router
{
	private routes: { path: string; component: string }[] = [];

	public addRoute(path: string, component: string): void {
		this.routes.push({ path, component });
	}

	// Dinamik route eşleştirme (/:id gibi parametreler için)
	private matchRoute(pathname: string): { route: { path: string; component: string } | undefined; params: Record<string, string> } {
		for (const route of this.routes) {
			// Exact match
			if (route.path === pathname) {
				return { route, params: {} };
			}
			
			// Dynamic route match (e.g., /friend/:id)
			const routeParts = route.path.split('/');
			const pathParts = pathname.split('/');
			
			if (routeParts.length !== pathParts.length) continue;
			
			const params: Record<string, string> = {};
			let isMatch = true;
			
			for (let i = 0; i < routeParts.length; i++) {
				if (routeParts[i].startsWith(':')) {
					// Dynamic segment
					const paramName = routeParts[i].slice(1);
					params[paramName] = pathParts[i];
				} else if (routeParts[i] !== pathParts[i]) {
					isMatch = false;
					break;
				}
			}
			
			if (isMatch) {
				return { route, params };
			}
		}
		
		return { route: undefined, params: {} };
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
		// Query parametrelerini ayır
		const [pathWithoutQuery] = path.split('?');
		const { route } = this.matchRoute(pathWithoutQuery);
		console.log("Navigating to:", path);
		if (route) {
			!((previouesPath === "/signup" || previouesPath === "/login") && path === "/") ? this.handleRoute(path) : window.history.replaceState(null, '', path);
			fillIndex(route.component, app);
			window.dispatchEvent(new CustomEvent('routechange', {
				detail: { path, previousPath: previouesPath }
			}));
		} else {
			this.handleRoute('/error/404');
			fillIndex('<error-page error-type="404" error-title="error_404_title" error-description="error_404_description"></error-page>', app);

			// Dispatch event for error page too
			window.dispatchEvent(new CustomEvent('routechange', {
				detail: { path: '/error/404', previousPath: previouesPath }
			}));
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
		htmlValue ? app.appendChild(stringToHTMLElement(htmlValue)) : app.appendChild(stringToHTMLElement('<error-page error-type="500" error-title="error_500_title" error-description="error_500_description"></error-page>'));
	}
	else{
		throw new Error("Error: root is undefined");
	}
}


const router = new Router();
addEventListener('popstate', (event) => {
	const path = (event.state && event.state.path) ? event.state.path : window.location.pathname + window.location.search;
	router.navigate(path);
});

function initializeRouter(): void {
	// Ana sayfa route'ları
	router.addRoute('/', '<dashboard-component></dashboard-component>');
	router.addRoute('/dashboard', '<dashboard-component></dashboard-component>');
	router.addRoute('/profile', '<my-profile></my-profile>');
	router.addRoute('/2fa', '<twofa-auth></twofa-auth>');
	router.addRoute('/2fa-login', '<twofa-login></twofa-login>');
	router.addRoute('/play', '<play-component></play-component>');
	router.addRoute('/game', '<game-component></game-component>');
	router.addRoute('/friends', '<friends-component></friends-component>');
	router.addRoute('/friend/:id', '<friend-profile></friend-profile>');
	router.addRoute('/chat', '<chat-component></chat-component>');
	router.addRoute('/settings', '<settings-component></settings-component>');
	router.addRoute('/settings/profile', '<settings-component></settings-component>');
	router.addRoute('/settings/security', '<settings-component></settings-component>');
	router.addRoute('/settings/appearance', '<settings-component></settings-component>');
	router.addRoute('/settings/account', '<settings-component></settings-component>');
	router.addRoute('/signup', '<signup-form></signup-form>');
	router.addRoute('/login', '<login-form></login-form>');
	router.addRoute('/auth/google', 'https://localhost:4343/api/auth/google');

	// Error page route'ları
	router.addRoute('/error/404', '<error-page error-type="404" error-title="error_404_title" error-description="error_404_description"></error-page>');
	router.addRoute('/error/500', '<error-page error-type="500" error-title="error_500_title" error-description="error_500_description"></error-page>');
	router.addRoute('/error/403', '<error-page error-type="403" error-title="error_403_title" error-description="error_403_description"></error-page>');
	router.addRoute('/error/401', '<error-page error-type="401" error-title="error_401_title" error-description="error_401_description"></error-page>');
	router.addRoute('/error/auth', '<error-page error-type="auth" error-title="error_auth_title" error-description="error_auth_description"></error-page>');

	// Genel error route'u (fallback)
	router.addRoute('/error', '<error-page error-type="500" error-title="error_generic_title" error-description="error_generic_description"></error-page>');
	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a');

		if (link && link.href && !link.href.startsWith('http') && !link.href.includes('://')) {
			e.preventDefault();
			const path = new URL(link.href).pathname;
			router.navigate(path);
		}
	});
	router.navigate(window.location.pathname + window.location.search);
}

export { fillIndex, router, initializeRouter };
