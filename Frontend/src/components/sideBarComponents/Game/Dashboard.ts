import { LocalizedComponent } from "../../base/LocalizedComponent";
import { getUser } from "../../../store/UserStore";
import { t } from "../../../i18n/lang";

export class Dashboard extends LocalizedComponent {
    protected renderComponent(): void {
        const user = getUser();
        if (!user) return;

        this.innerHTML = `
            <style>
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes glow-pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .game-card {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .game-card:hover {
                    transform: translateY(-4px);
                }
                .icon-float {
                    animation: float 3s ease-in-out infinite;
                }
                .glow-effect {
                    animation: glow-pulse 2s ease-in-out infinite;
                }
                .gradient-border {
                    position: relative;
                }
                .gradient-border::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    padding: 1px;
                    background: linear-gradient(135deg, var(--border-color-1), transparent, var(--border-color-2));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }
                .game-card:hover .gradient-border::before {
                    opacity: 1;
                }
                .dashboard-shell {
                    background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.75), rgba(2, 6, 23, 0.65)),
                        linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(8, 15, 28, 0.85));
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    backdrop-filter: blur(12px);
                }
                .card-grid {
                    grid-template-columns: 1fr;
                }
                @media (min-width: 1024px) {
                    .card-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                .balanced-card {
                    min-height: 260px;
                }
                .dashboard-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .dashboard-title-card {
                    padding: 1.25rem 2rem;
                    border-radius: 24px;
                    background: rgba(10, 15, 25, 0.92);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    box-shadow: 0 18px 42px -18px rgba(0, 0, 0, 0.55);
                    backdrop-filter: blur(16px);
                }
                .dashboard-subtitle {
                    padding: 0.5rem 1.5rem;
                    border-radius: 50px;
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(8, 15, 28, 0.9));
                    border: 1px solid rgba(148, 163, 184, 0.12);
                    backdrop-filter: blur(12px);
                }
                .dashboard-divider {
                    width: 180px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), rgba(139, 92, 246, 0.5), transparent);
                }
                .dashboard-main-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex: 1;
                    width: 100%;
                }
            </style>
            
            <div class="flex flex-col items-center w-full py-6 sm:py-8 text-gray-100">
                
                <!-- Header with animated gradient -->
                <div class="text-center mb-6 lg:mb-8 dashboard-header">
                    <div class="dashboard-title-card">
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-100">
                            ${t('game_dashboard_welcome', { username: '' })}
                            <span class="text-slate-100/90 font-semibold">${user.username}</span>
                        </h2>
                    </div>
                    <div class="dashboard-divider"></div>
                    <div class="dashboard-subtitle">
                        <p class="text-slate-200 text-xs sm:text-sm uppercase tracking-[0.3em] font-medium">${t('game_dashboard_select_mode')}</p>
                    </div>
                </div>

                <!-- Main Game Modes Container -->
                <div class="w-full max-w-6xl mx-auto">
                    <div class="dashboard-shell grid card-grid gap-5 lg:gap-6 w-full auto-rows-fr p-4 sm:p-6 rounded-3xl">
                    
                    <!-- Local Play Card -->
                    <div id="btnLocal" class="game-card group cursor-pointer balanced-card" style="--border-color-1: #10b981; --border-color-2: #06b6d4;">
                        <div class="gradient-border relative h-full bg-gradient-to-br from-slate-900/92 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-7 overflow-hidden border border-slate-700/50">
                            
                            <!-- Background Effects -->
                            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                            <div class="absolute top-20 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl"></div>
                            
                            <!-- Content -->
                            <div class="relative z-10 h-full flex flex-col">
                                <!-- Header Row -->
                                <div class="flex items-start justify-between mb-5 lg:mb-6">
                                    <div class="w-16 h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 group-hover:border-emerald-400/50 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300">
                                        <span class="text-3xl lg:text-4xl icon-float">🎮</span>
                                    </div>
                                    <div class="flex flex-col items-end gap-2">
                                        <div class="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full backdrop-blur-sm">
                                            <span class="text-emerald-400 text-xs font-bold tracking-wide">${t("game_dashboard_local_badge")}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                            <span>${t("game_dashboard_local_players")}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Title & Description -->
                                <div class="flex-1">
                                    <h3 class="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-emerald-50 transition-colors">
                                        ${t('game_dashboard_local_title')}
                                    </h3>
                                    <p class="text-gray-400 text-sm leading-relaxed max-w-sm">
                                        ${t('game_dashboard_local_desc')}
                                    </p>
                                </div>
                                
                                <!-- Action Button -->
                                <div class="mt-5 lg:mt-6 flex items-center justify-between">
                                    <div class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-xl group-hover:from-emerald-500/30 group-hover:to-cyan-500/20 group-hover:border-emerald-400/50 transition-all duration-300">
                                        <span class="text-emerald-400 text-sm font-semibold">${t("game_dashboard_local_action")}</span>
                                        <svg class="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                        <span>${t("game_dashboard_local_hint")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ranked/Matchmaking Card -->
                    <div id="btnMatchmaking" class="game-card group cursor-pointer balanced-card" style="--border-color-1: #8b5cf6; --border-color-2: #ec4899;">
                        <div class="gradient-border relative h-full bg-gradient-to-br from-slate-900/92 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-7 overflow-hidden border border-slate-700/50">
                            
                            <!-- Background Effects -->
                            <div class="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-500"></div>
                            <div class="absolute top-20 -left-10 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-2xl"></div>
                            
                            <!-- Content -->
                            <div class="relative z-10 h-full flex flex-col">
                                <!-- Header Row -->
                                <div class="flex items-start justify-between mb-5 lg:mb-6">
                                    <div class="w-16 h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-2xl flex items-center justify-center border border-violet-500/30 group-hover:border-violet-400/50 group-hover:shadow-lg group-hover:shadow-violet-500/20 transition-all duration-300">
                                        <span class="text-3xl lg:text-4xl icon-float">⚔️</span>
                                    </div>
                                    <div class="flex flex-col items-end gap-2">
                                        <div class="px-3 py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                                            <span class="w-2 h-2 bg-green-400 rounded-full glow-effect"></span>
                                            <span class="text-violet-400 text-xs font-bold tracking-wide">${t("game_dashboard_ranked_badge")}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Title & Description -->
                                <div class="flex-1">
                                    <h3 class="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-violet-50 transition-colors">
                                        ${t('game_dashboard_ranked_title')}
                                    </h3>
                                    <p class="text-gray-400 text-sm leading-relaxed max-w-sm">
                                        ${t('game_dashboard_ranked_desc')}
                                    </p>
                                </div>
                                
                                <!-- Action Button -->
                                <div class="mt-5 lg:mt-6 flex items-center justify-between">
                                    <div class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 rounded-xl group-hover:from-violet-500/30 group-hover:to-fuchsia-500/20 group-hover:border-violet-400/50 transition-all duration-300">
                                        <span class="text-violet-400 text-sm font-semibold">${t("game_dashboard_ranked_action")}</span>
                                        <svg class="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <span class="w-1.5 h-1.5 bg-violet-400 rounded-full"></span>
                                        <span>${t("game_dashboard_ranked_hint")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                        
                    <!-- Tournament 4 Players Card -->
                    <div id="btnTourney4" class="game-card group cursor-pointer balanced-card" style="--border-color-1: #f59e0b; --border-color-2: #f97316;">
                        <div class="gradient-border relative h-full bg-gradient-to-br from-slate-900/92 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-7 overflow-hidden border border-slate-700/50">
                            
                            <!-- Background Effects -->
                            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="absolute -bottom-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
                            
                            <!-- Content -->
                            <div class="relative z-10 h-full flex flex-col">
                                <!-- Header Row -->
                                <div class="flex items-start justify-between mb-5 lg:mb-6">
                                    <div class="w-16 h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30 group-hover:border-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
                                        <span class="text-3xl lg:text-4xl icon-float">🏆</span>
                                    </div>
                                    <div class="flex flex-col items-end gap-2">
                                        <div class="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full backdrop-blur-sm">
                                            <span class="text-amber-400 text-xs font-bold tracking-wide">${t("game_dashboard_tournament_badge")}</span>
                                        </div>
                                        <div class="flex items-center gap-1 mt-1">
                                            <div class="flex -space-x-1">
                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/40 border border-amber-400/50"></div>
                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/40 border border-amber-400/50"></div>
                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/40 border border-amber-400/50"></div>
                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/40 to-amber-600/40 border border-amber-400/50"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Title & Description -->
                                <div class="flex-1">
                                    <h3 class="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-amber-50 transition-colors">
                                        ${t('game_dashboard_tournament_4_title')}
                                    </h3>
                                    <p class="text-gray-400 text-sm leading-relaxed max-w-sm">
                                        ${t('game_dashboard_tournament_4_desc')}
                                    </p>
                                </div>
                                
                                <!-- Action Button -->
                                <div class="mt-5 lg:mt-6 flex items-center justify-between">
                                    <div class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl group-hover:from-amber-500/30 group-hover:to-orange-500/20 group-hover:border-amber-400/50 transition-all duration-300">
                                        <span class="text-amber-400 text-sm font-semibold">${t("game_dashboard_tournament_action")}</span>
                                        <svg class="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                        <span>${t("game_dashboard_tournament_players_4")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tournament 8 Players Card -->
                    <div id="btnTourney8" class="game-card group cursor-pointer balanced-card" style="--border-color-1: #f43f5e; --border-color-2: #ec4899;">
                        <div class="gradient-border relative h-full bg-gradient-to-br from-slate-900/92 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-7 overflow-hidden border border-slate-700/50">
                            
                            <!-- Background Effects -->
                            <div class="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="absolute -bottom-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
                            
                            <!-- Content -->
                            <div class="relative z-10 h-full flex flex-col">
                                <!-- Header Row -->
                                <div class="flex items-start justify-between mb-5 lg:mb-6">
                                    <div class="w-16 h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-rose-500/20 to-pink-500/10 rounded-2xl flex items-center justify-center border border-rose-500/30 group-hover:border-rose-400/50 group-hover:shadow-lg group-hover:shadow-rose-500/20 transition-all duration-300">
                                        <span class="text-3xl lg:text-4xl icon-float">👑</span>
                                    </div>
                                    <div class="flex flex-col items-end gap-2">
                                        <div class="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                                            <svg class="w-3 h-3 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                            </svg>
                                            <span class="text-rose-400 text-xs font-bold tracking-wide">${t("game_dashboard_championship_badge")}</span>
                                        </div>
                                        <div class="flex items-center gap-1 mt-1">
                                            <div class="flex -space-x-0.5">
                                                <div class="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400/40 to-rose-600/40 border border-rose-400/50"></div>
                                                <div class="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400/40 to-rose-600/40 border border-rose-400/50"></div>
                                                <div class="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400/40 to-rose-600/40 border border-rose-400/50"></div>
                                                <div class="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400/40 to-rose-600/40 border border-rose-400/50"></div>
                                                <div class="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500/50 to-rose-700/50 border border-rose-400/50 flex items-center justify-center text-[7px] text-rose-200 font-bold">+4</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Title & Description -->
                                <div class="flex-1">
                                    <h3 class="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-rose-50 transition-colors">
                                        ${t('game_dashboard_tournament_8_title')}
                                    </h3>
                                    <p class="text-gray-400 text-sm leading-relaxed max-w-sm">
                                        ${t('game_dashboard_tournament_8_desc')}
                                    </p>
                                </div>
                                
                                <!-- Action Button -->
                                <div class="mt-5 lg:mt-6 flex items-center justify-between">
                                    <div class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500/20 to-pink-500/10 border border-rose-500/30 rounded-xl group-hover:from-rose-500/30 group-hover:to-pink-500/20 group-hover:border-rose-400/50 transition-all duration-300">
                                        <span class="text-rose-400 text-sm font-semibold">${t("game_dashboard_tournament_action")}</span>
                                        <svg class="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <span class="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                                        <span>${t("game_dashboard_tournament_players_8")}</span>
                                    </div>
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
        this.querySelector('#btnLocal')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'local' }, bubbles: true }));
        });
        this.querySelector('#btnMatchmaking')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'matchmaking' }, bubbles: true }));
        });
        this.querySelector('#btnTourney4')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'tournament', size: 4 }, bubbles: true }));
        });
        this.querySelector('#btnTourney8')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'tournament', size: 8 }, bubbles: true }));
        });
    }
}

customElements.define("game-dashboard", Dashboard);
