import { router } from "../../router/Router";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

class SideBar extends LocalizedComponent {
	private activeRoute: string = "dashboard";
	private isCollapsed: boolean = false;
	private isMobileOpen: boolean = false;
	private sidebarListener: SidebarStateListener | null = null;
	private mediaQueryList: MediaQueryList | null = null;

	protected onConnected(): void {
		this.updateActiveRouteFromURL();
		this.setupRouteListener();
		
		// Sidebar state'ini manager'dan oku
		const sidebarState = sidebarStateManager.getState();
		this.isCollapsed = sidebarState.isCollapsed;
		this.isMobileOpen = sidebarState.isMobileOpen;
		this.setupSidebarListener();
		this.setupMediaQueryListener();
		
		this.updateNavItemStyles();
		this.updateSidebarLayout();
		// State'i güncelleme, sadece mevcut state'i koru
	}

	protected onDisconnected(): void {
		window.removeEventListener("routechange", this.handleRouteChange);
		window.removeEventListener("popstate", this.handleRouteChange);
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		if (this.mediaQueryList) {
			this.mediaQueryList.removeEventListener("change", this.handleMediaChange);
			this.mediaQueryList = null;
		}
		document.body.classList.remove("overflow-hidden");
	}

	protected renderComponent(): void {
		const width = this.isCollapsed ? "w-72 md:w-16" : "w-72 md:w-72";
		const padding = this.isCollapsed ? "px-2" : "px-4";
		const translateClass = this.isMobileOpen ? "translate-x-0" : "-translate-x-full";

		this.innerHTML = `
			<div id="sidebarOverlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${this.isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}"></div>
			<div id="sidebarContainer" class="${width} ${translateClass} md:translate-x-0 bg-white dark:bg-gray-800 shadow-lg h-screen border-r border-gray-200 dark:border-gray-700 transition-all duration-300 fixed left-0 top-0 z-60">
				<div class="flex ${this.isCollapsed ? "justify-center" : "justify-end"} p-4 border-b border-gray-200 dark:border-gray-700">
					<button id="hamburgerToggle" aria-label="${t("sidebar_toggle_aria")}" class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center rounded-lg hover:shadow-lg">
						<svg class="w-6 h-6 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${this.isCollapsed ? "" : "rotate-90"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>
				</div>

				<div class="py-6 ${padding}">
					<nav class="space-y-1">
						${this.renderNavItem("/", "dashboard", "🏠", t("sidebar_nav_dashboard"), t("sidebar_nav_dashboard_title"))}
						${this.renderNavItem("/profile", "profile", "👤", t("sidebar_nav_profile"), t("sidebar_nav_profile_title"))}
						${this.renderNavItem("/play", "play", "🎮", t("sidebar_nav_play"), t("sidebar_nav_play_title"))}
						${this.renderNavItem("/tournament", "tournament", "🏆", t("sidebar_nav_tournament"), t("sidebar_nav_tournament_title"))}
						${this.renderNavItem("/friends", "friends", "👥", t("sidebar_nav_friends"), t("sidebar_nav_friends_title"))}
						${this.renderNavItem("/chat", "chat", "💬", t("sidebar_nav_chat"), t("sidebar_nav_chat_title"))}
						${this.renderNavItem("/settings", "settings", "⚙️", t("sidebar_nav_settings"), t("sidebar_nav_settings_title"))}
					</nav>
				</div>
			</div>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.updateActiveRouteFromURL();
		this.updateNavItemStyles();
		this.updateSidebarLayout();
	}

	private renderNavItem(path: string, route: string, icon: string, label: string, title: string): string {
		const isCollapsedClass = this.isCollapsed ? "justify-center px-2" : "px-4";
		return `
			<a href="${path}" data-route="${route}" class="nav-item flex items-center min-w-0 ${isCollapsedClass} py-4 mb-2 ${this.getNavItemClasses(route)} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md min-h-[44px]" title="${title}">
				<span class="text-2xl ${this.isCollapsed ? "" : "mr-4"} transition-all duration-300 flex-shrink-0">${icon}</span>
				<span class="nav-text ${this.isCollapsed ? "opacity-0 scale-0 w-0 overflow-hidden" : "opacity-100 scale-100"} transition-all duration-300 ease-out truncate">${label}</span>
			</a>
		`;
	}

	private handleRouteChange = (): void => {
		this.updateActiveRouteFromURL();
		this.updateNavItemStyles();
	};

	private setupRouteListener(): void {
		window.addEventListener("routechange", this.handleRouteChange);
		window.addEventListener("popstate", this.handleRouteChange);
	}

	private updateActiveRouteFromURL(): void {
		const currentPath = window.location.pathname;
		switch (currentPath) {
			case "/":
			case "/dashboard":
				this.activeRoute = "dashboard";
				break;
			case "/profile":
				this.activeRoute = "profile";
				break;
			case "/play":
				this.activeRoute = "play";
				break;
			case "/tournament":
				this.activeRoute = "tournament";
				break;
			case "/friends":
				this.activeRoute = "friends";
				break;
			case "/chat":
				this.activeRoute = "chat";
				break;
			case "/settings":
				this.activeRoute = "settings";
				break;
			default:
				this.activeRoute = "dashboard";
		}
	}

	private setupEvents(): void {
		const hamburgerBtn = this.querySelector<HTMLButtonElement>("#hamburgerToggle");
		hamburgerBtn?.addEventListener("click", () => this.toggleSidebar());

		const overlay = this.querySelector<HTMLDivElement>("#sidebarOverlay");
		overlay?.addEventListener("click", () => sidebarStateManager.closeMobile());

		const navItems = this.querySelectorAll("[data-route]");
		navItems.forEach(item => {
			item.addEventListener("click", (e) => {
				e.preventDefault();
				const route = (item as HTMLElement).getAttribute("data-route");
				this.handleNavigation(route);
			});
		});
	}

	private getNavItemClasses(route: string): string {
		return this.activeRoute === route
			? "text-blue-900 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 font-semibold border-blue-200 dark:border-blue-800"
			: "text-gray-700 dark:text-gray-300 font-medium border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500";
	}

	private updateNavItemStyles(): void {
		const navItems = this.querySelectorAll("[data-route]");
		navItems.forEach(item => {
			const route = (item as HTMLElement).getAttribute("data-route");
			if (route) {
				const classes = this.getNavItemClasses(route);
				item.className = `nav-item flex items-center min-w-0 ${this.isCollapsed ? "justify-center px-2" : "px-4"} py-4 mb-2 ${classes} rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md min-h-[44px]`;
			}
		});
	}

	private handleNavigation(route: string | null): void {
		if (!route) return;

		let path = "/";
		switch (route) {
			case "dashboard":
				path = "/";
				break;
			case "profile":
				path = "/profile";
				break;
			case "play":
				path = "/play";
				break;
			case "tournament":
				path = "/tournament";
				break;
			case "friends":
				path = "/friends";
				break;
			case "chat":
				path = "/chat";
				break;
			case "settings":
				path = "/settings";
				break;
		}

		this.activeRoute = route;
		router.navigate(path);
		sidebarStateManager.closeMobile();
	}

	public updateActiveRoute(newRoute: string): void {
		this.activeRoute = newRoute;
		this.updateNavItemStyles();
	}

	private toggleSidebar(): void {
		if (this.isMobileViewport()) {
			sidebarStateManager.toggleMobile();
			return;
		}

		this.isCollapsed = !this.isCollapsed;
		sidebarStateManager.updateState(this.isCollapsed);
		this.updateSidebarLayout();
		this.updateNavItemStyles();
	}

	private updateSidebarLayout(): void {
		const container = this.querySelector("#sidebarContainer");
		const overlay = this.querySelector("#sidebarOverlay");
		const navItems = this.querySelectorAll(".nav-item");
		const textElements = this.querySelectorAll(".nav-text");
		const iconElements = this.querySelectorAll(".nav-item span:first-child");
		const hamburgerContainer = this.querySelector("#sidebarContainer > div:first-child");
		const hamburgerIcon = this.querySelector("#hamburgerToggle svg");
		const navWrapper = this.querySelector(".py-6");
		const isDesktop = this.isDesktopViewport();

		if (container) {
			container.classList.toggle("md:w-72", !this.isCollapsed);
			container.classList.toggle("md:w-16", this.isCollapsed);
			container.classList.toggle("-translate-x-full", !this.isMobileOpen);
			container.classList.toggle("translate-x-0", this.isMobileOpen);
		}

		if (overlay) {
			overlay.classList.toggle("opacity-100", this.isMobileOpen);
			overlay.classList.toggle("opacity-0", !this.isMobileOpen);
			overlay.classList.toggle("pointer-events-none", !this.isMobileOpen);
		}

		if (this.isMobileOpen && !isDesktop) {
			document.body.classList.add("overflow-hidden");
		} else {
			document.body.classList.remove("overflow-hidden");
		}

		if (navWrapper) {
			if (this.isCollapsed) {
				navWrapper.classList.remove("px-4");
				navWrapper.classList.add("px-2");
			} else {
				navWrapper.classList.remove("px-2");
				navWrapper.classList.add("px-4");
			}
		}

		if (hamburgerContainer) {
			hamburgerContainer.classList.toggle("justify-end", !this.isCollapsed);
			hamburgerContainer.classList.toggle("justify-center", this.isCollapsed);
		}

		if (hamburgerIcon) {
			hamburgerIcon.classList.toggle("rotate-90", !this.isCollapsed);
		}

		navItems.forEach(item => {
			item.classList.toggle("justify-center", this.isCollapsed);
			item.classList.toggle("px-2", this.isCollapsed);
			item.classList.toggle("px-4", !this.isCollapsed);
		});

		textElements.forEach((text, index) => {
			setTimeout(() => {
				text.classList.toggle("opacity-100", !this.isCollapsed);
				text.classList.toggle("opacity-0", this.isCollapsed);
				text.classList.toggle("scale-100", !this.isCollapsed);
				text.classList.toggle("scale-0", this.isCollapsed);
				text.classList.toggle("w-0", this.isCollapsed);
				text.classList.toggle("overflow-hidden", this.isCollapsed);
			}, index * 20);
		});

		iconElements.forEach((icon, index) => {
			setTimeout(() => {
				icon.classList.toggle("mr-4", !this.isCollapsed);
			}, index * 15);
		});
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.isCollapsed = state.isCollapsed;
			this.isMobileOpen = state.isMobileOpen;
			this.updateSidebarLayout();
			this.updateNavItemStyles();
		};
		sidebarStateManager.addListener(this.sidebarListener);
	}

	private setupMediaQueryListener(): void {
		this.mediaQueryList = window.matchMedia("(min-width: 768px)");
		this.mediaQueryList.addEventListener("change", this.handleMediaChange);
	}

	private handleMediaChange = (event: MediaQueryListEvent): void => {
		if (event.matches) {
			sidebarStateManager.closeMobile();
		}
	};

	private isMobileViewport(): boolean {
		return !this.isDesktopViewport();
	}

	private isDesktopViewport(): boolean {
		return this.mediaQueryList?.matches ?? window.matchMedia("(min-width: 768px)").matches;
	}
}

customElements.define("sidebar-component", SideBar);
export { SideBar };
