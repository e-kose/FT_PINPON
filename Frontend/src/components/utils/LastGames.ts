import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";
import { getUserStatistic } from "../../services/GameStatService";
import type { RecentMatch } from "../../types/GameStatsType";

interface GameResult {
    id: string;
    opponent: string;
    opponentId: string;
    result: 'win' | 'loss';
    playerScore: number;
    opponentScore: number;
    playedAt: string;
    gameMode?: string;
}

class LastGames extends LocalizedComponent {
    private games: GameResult[] = [];
    private loading = true;
    private error: string | null = null;
    private userId: string | null = null;

    static get observedAttributes() {
        return ['user-id'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue === newValue) return;
        if (name === 'user-id') {
            this.userId = newValue;
            void this.fetchGames();
        }
    }

    protected onConnected(): void {
        this.userId = this.getAttribute('user-id');
        void this.fetchGames();
    }

    private async fetchGames(): Promise<void> {
        this.loading = true;
        this.error = null;
        this.renderAndBind();

        try {
            const response = await getUserStatistic(this.userId || undefined);
            
            if (!response.ok || !response.data.success || !response.data.data) {
                this.error = response.data.error || response.data.message || t("last_games_error_fetch");
                this.games = [];
            } else {
                const profile = response.data.data;
                const currentUserId = profile.userId;
                
                // RecentMatch'leri GameResult formatına dönüştür
                this.games = (profile.recentMatches || []).map((match: RecentMatch) => {
                    const isPlayer1 = match.player1.id === currentUserId;
                    const isWinner = match.winnerId === currentUserId;
                    const opponent = isPlayer1 ? match.player2 : match.player1;
                    const myScore = isPlayer1 ? match.player1.score : match.player2.score;
                    const oppScore = isPlayer1 ? match.player2.score : match.player1.score;

                    return {
                        id: match.id,
                        opponent: opponent.username,
                        opponentId: opponent.id,
                        result: isWinner ? 'win' : 'loss',
                        playerScore: myScore,
                        opponentScore: oppScore,
                        playedAt: match.playedAt,
                        gameMode: 'ranked'
                    } as GameResult;
                });
                this.error = null;
            }
        } catch (err) {
            console.error(t("last_games_load_error_log"), err);
            this.error = t("last_games_error_network");
            this.games = [];
        } finally {
            this.loading = false;
            this.renderAndBind();
        }
    }

    public refresh(): void {
        void this.fetchGames();
    }

    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return t("last_games_time_minutes_ago", { count: Math.max(1, diffMins) });
        } else if (diffHours < 24) {
            return t("last_games_time_hours_ago", { count: diffHours });
        } else {
            return t("last_games_time_days_ago", { count: diffDays });
        }
    }

    private translateGameMode(mode?: string): { label: string; icon: string } {
        if (!mode) {
            return { label: "", icon: "🎮" };
        }

        const normalized = mode.toLowerCase();
        switch (normalized) {
            case "ranked":
                return { label: t("last_games_mode_ranked"), icon: "🏅" };
            case "tournament":
                return { label: t("last_games_mode_tournament"), icon: "🏆" };
            case "casual":
                return { label: t("last_games_mode_casual"), icon: "🎮" };
            default:
                return { label: mode, icon: "🎮" };
        }
    }

    protected renderComponent(): void {
        if (this.loading) {
            this.innerHTML = this.renderLoading();
            return;
        }

        if (this.error) {
            this.innerHTML = this.renderError();
            return;
        }

        if (this.games.length === 0) {
            this.innerHTML = this.renderEmpty();
            return;
        }

        this.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-white text-lg">🎮</span>
                        </div>
                        <div>
                            <h3 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">${t("last_games_heading")}</h3>
                            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">${t("last_games_subheading")}</p>
                        </div>
                    </div>
                    <button class="refresh-btn bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 min-h-[36px] sm:min-h-[44px]">
                        ${t("last_games_refresh")}
                    </button>
                </div>
                <div id="gamesContainer" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    ${this.generateGamesHTML()}
                </div>
            </div>
        `;
    }

    private renderLoading(): string {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div class="flex flex-col items-center justify-center py-8 sm:py-12">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">${t("last_games_loading")}</p>
                </div>
            </div>
        `;
    }

    private renderError(): string {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div class="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                        <svg class="w-6 h-6 sm:w-7 sm:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">${this.error}</p>
                    <button class="retry-btn text-xs sm:text-sm text-blue-500 hover:text-blue-600 font-medium min-h-[36px] px-4">${t("last_games_retry")}</button>
                </div>
            </div>
        `;
    }

    private renderEmpty(): string {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div class="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <span class="text-2xl sm:text-3xl">🎮</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">${t("last_games_empty_title")}</h3>
                    <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs">${t("last_games_empty_description")}</p>
                </div>
            </div>
        `;
    }

    protected afterRender(): void {
        this.setupEvents();
    }

    private generateGamesHTML(): string {
        return this.games.slice(0, 6).map(game => {
            const resultClass = game.result === 'win' 
                ? 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' 
                : 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
            
            const resultIcon = game.result === 'win' ? '🏆' : '😞';
            const resultText = game.result === 'win' ? t("last_games_result_win") : t("last_games_result_loss");
            
            const { label: gameModeLabel, icon: gameModeIcon } = this.translateGameMode(game.gameMode);
            const timeAgo = this.formatTimeAgo(game.playedAt);
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-5 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] sm:hover:scale-105" data-game-id="${game.id}">
                    <!-- Header with opponent and result -->
                    <div class="flex justify-between items-center gap-2 mb-3 sm:mb-4">
                        <div class="flex items-center space-x-2 min-w-0">
                            <div class="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">${game.opponent.charAt(0).toUpperCase()}</span>
                            </div>
                            <span class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-[140px]">${game.opponent}</span>
                        </div>
                        <div class="flex items-center space-x-1 ${resultClass} px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border text-[9px] sm:text-[10px] lg:text-xs font-bold whitespace-nowrap">
                            <span>${resultIcon}</span>
                            <span>${resultText}</span>
                        </div>
                    </div>
                    
                    <!-- Score -->
                    <div class="text-center mb-3 sm:mb-4">
                        <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            <span class="${game.result === 'win' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}">${game.playerScore}</span>
                            <span class="text-gray-400 mx-1 sm:mx-2">-</span>
                            <span class="${game.result === 'loss' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}">${game.opponentScore}</span>
                        </div>
                        <div class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">${t("last_games_final_score")}</div>
                    </div>
                    
                    <!-- Footer with time and game mode -->
                    <div class="flex flex-wrap justify-between items-center gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <span class="text-[10px] sm:text-xs">⏰</span>
                            <span class="text-[10px] sm:text-xs font-medium">${timeAgo}</span>
                        </div>
                        ${gameModeLabel ? `
                            <div class="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span class="text-[10px] sm:text-xs">${gameModeIcon}</span>
                                <span class="text-[10px] sm:text-xs font-semibold">${gameModeLabel}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    private setupEvents(): void {
        // Refresh button
        this.querySelector('.refresh-btn')?.addEventListener('click', () => this.refresh());
        
        // Retry button
        this.querySelector('.retry-btn')?.addEventListener('click', () => this.refresh());

        // Game item clicks
        const gameItems = this.querySelectorAll('[data-game-id]');
        gameItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const gameId = (e.currentTarget as HTMLElement).getAttribute('data-game-id');
                this.handleGameClick(gameId);
            });
        });
    }

    private handleGameClick(gameId: string | null): void {
        // TODO: Show detailed game info or navigate
        void gameId;
    }

    // Public methods
    public getGames(): GameResult[] {
        return [...this.games];
    }

    public getGameById(id: string): GameResult | undefined {
        return this.games.find(game => game.id === id);
    }

    public getWinLossStats(): { wins: number; losses: number; winRate: number } {
        const wins = this.games.filter(g => g.result === 'win').length;
        const losses = this.games.filter(g => g.result === 'loss').length;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        return { wins, losses, winRate };
    }
}

customElements.define("last-games-component", LastGames);

export default LastGames;
