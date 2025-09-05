import ErrorPages  from "../components/errors/ErrorPages";
import "../components/forms/SignupForm";
import "../components/forms/UserForm";
class Router
{

	
	private routes: { path: string; component: string }[] = [];
	
	public addRoute(path: string, component: string): void {
		this.routes.push({ path, component });
	}
	public navigate(path: string): void {
		console.log("Navigating to:", path);
		const route = this.routes.find(r => r.path === path);
		if (route) {
			fillIndex(route.component, path);
		} else {
			const errPages = new ErrorPages();
			fillIndex(errPages.ErrorPages.notFound(), path);
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

function fillIndex(htmlValue: string, path?: string): void {
	const app = document.getElementById("app");
	const errPages = new ErrorPages();
	
	if (app) {
		if (htmlValue) {
			//xss koruması
			app.innerHTML = "";
			app.appendChild(stringToHTMLElement(htmlValue));	
			if (path && window.location.pathname !== path) {
				window.history.pushState({ path }, '', path);
			}
		} else {
			const errorElement = stringToHTMLElement(errPages.ErrorPages.general());
			app.appendChild(errorElement);
		}
	} else {
		throw new Error("Error: root is undefined");
	}
}


const router = new Router();
addEventListener('popstate', (event) => {
	console.log("Popstate event:", event);
	if (event.state && event.state.path) {
		router.navigate(event.state.path);
	}
});

function initializeRouter(): void {
	router.addRoute('/', '<signup-form></signup-form>');
	router.addRoute('/login', '<login-form></login-form>');
	router.addRoute('/signup', '<signup-form></signup-form>');
	
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