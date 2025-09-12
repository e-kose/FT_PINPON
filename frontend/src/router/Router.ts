import ErrorPages  from "../components/errors/ErrorPages";
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
		console.log("Navigating to:", path);
		const app = document.getElementById("app");
		const route = this.routes.find(r => r.path === path);
		if (route) {
			!((previouesPath === "/signup" || previouesPath === "/login") && path === "/") ? this.handleRoute(path) : window.history.replaceState(null, '', path);
			fillIndex(route.component, app);
		} else {
			const errPages = new ErrorPages();
			this.handleRoute('/error');
			fillIndex(errPages.ErrorPages.notFound(), app);
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
		htmlValue ? app.appendChild(stringToHTMLElement(htmlValue)) : app.appendChild(stringToHTMLElement(new ErrorPages().ErrorPages.general()));
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
	router.addRoute('/', '<dashboard-component></dashboard-component>');
	router.addRoute('/login', '<login-form></login-form>');
	router.addRoute('/signup', '<signup-form></signup-form>');
	router.addRoute('/settings', '<settings-component></settings-component>');
	router.addRoute('/play', '<play-component></play-component>');
	router.addRoute('/tournament', '<tournament-component></tournament-component>');
	router.addRoute('/friends', '<friends-component></friends-component>');
	router.addRoute('/chat', '<chat-component></chat-component>');
	router.addRoute('/error', new ErrorPages().ErrorPages.general());
	
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