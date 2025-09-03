import ErrorPages  from "../components/errors/ErrorPages";

function fillIndex(htmlValue: string, path?: string): void {
	const app = document.getElementById("app");
	const errPages = new ErrorPages();
	
	if (app) {
		if (htmlValue) {
			app.innerHTML = htmlValue;
			
			// URL path'i güncelle (eğer path verilmişse)
			if (path && window.location.pathname !== path) {
				window.history.pushState({ path }, '', path);
			}
		} else {
			errPages.ErrorPages.general();
		}
	} else {
		throw new Error("Error: root is undefined");
	}
}

// Route'ları handle etmek için yardımcı fonksiyon
function navigateTo(path: string, component: string): void {
	fillIndex(component, path);
}

// Link click'lerini yakalamak için global event listener
function setupRouter(): void {
	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a');
		
		if (link && link.href && !link.href.startsWith('http') && !link.href.includes('://')) {
			e.preventDefault();
			const path = new URL(link.href).pathname;
			
			// Route'a göre component'i belirle
			let component = '';
			switch (path) {
				case '/login':
					component = '<login-form> </login-form>';
					break;
				case '/signup':
					component = '<signup-form> </signup-form>';
					break;
				case '/':
				case '/home':
					component = '<home-page> </home-page>';
					break;
				default:
					component = '<error-404> </error-404>';
			}
			
			navigateTo(path, component);
		}
	});
}

export { fillIndex, navigateTo, setupRouter };