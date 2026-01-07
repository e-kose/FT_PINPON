import "./Header";
import "./SideBar";
import "../sideBarComponents/Game/GameStatistics";
import { getUser } from "../../store/UserStore";
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";
import { router } from "../../router/Router";
import { t, getLanguage } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { APP_CONTAINER, MAIN_CONTENT_SCROLL, PAGE_TOP_OFFSET } from "./Layout";

class MyProfile extends LocalizedComponent {
	private sidebarListener: SidebarStateListener | null = null;
	private handleRootClick = (e: Event) => {
		const target = e.target as HTMLElement;
		if (target.closest('.edit-profile-btn')) {
			router.navigate('/settings/profile');
		}
	};

	protected onConnected(): void {
		if (!this.sidebarListener) {
			this.setupSidebarListener();
		}
	}

	protected onDisconnected(): void {
		if (this.sidebarListener) {
			sidebarStateManager.removeListener(this.sidebarListener);
			this.sidebarListener = null;
		}
		this.removeEventListener('click', this.handleRootClick);
	}

	private setupSidebarListener(): void {
		this.sidebarListener = (state) => {
			this.updateMainContentMargin(state.isCollapsed);
		};
		sidebarStateManager.addListener(this.sidebarListener);
		
		// Initial state için margin'i ayarla
		this.updateMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}

	private updateMainContentMargin(isCollapsed: boolean): void {
		const mainContent = this.querySelector('.main-content');
		if (mainContent) {
			mainContent.classList.add('ml-0');
			mainContent.classList.toggle('md:ml-16', isCollapsed);
			mainContent.classList.toggle('md:ml-72', !isCollapsed);
		}
	}

	private setupEvents(): void {
		// Profili Düzenle button - Settings/Profile sayfasına yönlendir
		this.removeEventListener('click', this.handleRootClick);
		this.addEventListener('click', this.handleRootClick);

		const loginButton = this.querySelector('.login-redirect-btn');
		loginButton?.addEventListener('click', () => {
			router.navigate('/login');
		});
	}




	private formatDate(dateString: string): string {
		const date = new Date(dateString);
		const locale = getLanguage() === "tr" ? "tr-TR" : "en-US";
		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	protected renderComponent(): void {
		const user = getUser();

		if (!user) {
			this.innerHTML = `
                <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${t("my_profile_login_required_title")}</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">${t("my_profile_login_required_description")}</p>
                        <button class="login-redirect-btn bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 min-h-[44px]">
                            ${t("my_profile_login_required_button")}
                        </button>
                    </div>
                </div>
            `;
			return;
		}

		const marginClass = sidebarStateManager.getMarginClass();



        const fullName = user.profile?.full_name?.trim() || t("my_profile_value_missing");
		const displayName = user.profile?.full_name?.trim() || user.username;
		const bio = user.profile?.bio?.trim() || t("my_profile_bio_empty");
		const bioClass = user.profile?.bio ? "" : "text-gray-500 italic";
		const twoFaStatusClass = user.is_2fa_enabled ? 'from-green-500/20 to-emerald-500/20' : 'from-yellow-500/20 to-orange-500/20';
		const twoFaStatusIndicator = user.is_2fa_enabled ? 'bg-green-400' : 'bg-yellow-400';
		const twoFaStatusText = user.is_2fa_enabled ? t("my_profile_2fa_enabled") : t("my_profile_2fa_disabled");
		const twoFaWarning = !user.is_2fa_enabled
			? `<div class="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20"><span class="text-yellow-200">${t("my_profile_2fa_enable_prompt")}</span></div>`
			: "";

		this.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900" style="background-image: url('/DashboardBackground.jpg'); background-size: cover; background-position: center; background-attachment: fixed;">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="${PAGE_TOP_OFFSET}">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="profile"></sidebar-component>

                    <!-- Main Content -->
                    <div class="main-content ${marginClass} ${MAIN_CONTENT_SCROLL} min-w-0" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))">
                        <div class="${APP_CONTAINER}">
                            <!-- Profile Header -->
                            <div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 overflow-hidden mb-6">
                                <div class="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-black p-8 text-white relative overflow-hidden">
                                    <!-- Background Pattern -->
                                    <div class="absolute inset-0 opacity-10">
                                        <div class="absolute top-4 right-4 text-6xl">🏓</div>
                                        <div class="absolute bottom-4 left-4 text-4xl">🎮</div>
                                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">🏆</div>
                                    </div>
                                    
                                    <div class="relative z-10 flex flex-col lg:flex-row items-center lg:items-end space-y-6 lg:space-y-0 lg:space-x-8">
                                        <div class="relative">
                                            <img 
                                                src="${user.profile?.avatar_url}" 
                                                alt="${t("my_profile_avatar_alt")}" 
                                                class="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/30 shadow-2xl ring-4 ring-white/20"
                                            >
                                        </div>
                                        
                                        <div class="text-center lg:text-left flex-1">
                                            <h1 class="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                                ${displayName}
                                            </h1>
                                            <p class="text-gray-300 text-xl mb-4">@${user.username}</p>
                                            
                                            <!-- Security Status in Header -->
                                            <div class="flex flex-wrap justify-center lg:justify-start gap-3">
                                                <div class="bg-gradient-to-r ${twoFaStatusClass} backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20">
                                                    <div class="flex items-center space-x-2">
                                                        <div class="w-2 h-2 rounded-full ${twoFaStatusIndicator}"></div>
                                                        <span>${twoFaStatusText}</span>
                                                    </div>
                                                </div>
                                                ${twoFaWarning}
                                            </div>
                                        </div>
                                        
                                        <button class="edit-profile-btn w-full sm:w-auto bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl min-h-[44px]">
                                            <span class="flex items-center space-x-2">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                                <span>${t("my_profile_edit_button")}</span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Profile Content -->
                            <div class="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl shadow-xl border border-white/30 p-8">
                                <div class="profile-content">
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                        <!-- Personal Information -->
                                        <div class="lg:col-span-2 space-y-6">
                                            <div class="flex items-center space-x-3 mb-6">
                                                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                    </svg>
                                                </div>
                                                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${t("my_profile_personal_info_title")}</h3>
                                            </div>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">${t("my_profile_label_full_name")}</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${fullName}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">${t("my_profile_label_username")}</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">@${user.username}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">${t("my_profile_label_email")}</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${user.email}</p>
                                                </div>
                                                
                                                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300">
                                                    <label class="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">${t("my_profile_label_member_since")}</label>
                                                    <p class="text-xl font-medium text-gray-900 dark:text-white">${this.formatDate(user.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Bio -->
                                        <div class="space-y-6">
                                            <div class="flex items-center space-x-3 mb-6">
                                                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                </div>
                                                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${t("my_profile_bio_title")}</h3>
                                            </div>
                                            
                                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50 min-h-[200px] hover:shadow-lg transition-all duration-300">
                                                <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg ${bioClass}">
                                                    ${bio}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Game Statistics Component -->
                                    <div class="border-t border-gray-200/50 dark:border-gray-600/50 pt-8">
                                        <game-statistics mode="summary"></game-statistics>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
	}

	protected afterRender(): void {
		this.setupEvents();
		this.updateMainContentMargin(sidebarStateManager.getState().isCollapsed);
	}
}

customElements.define('my-profile', MyProfile);

export default MyProfile;
