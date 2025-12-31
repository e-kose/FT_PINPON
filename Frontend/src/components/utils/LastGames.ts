import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

interface GameResult {
    id: string;
    opponent: string;
    result: 'win' | 'loss';
    playerScore: number;
    opponentScore: number;
    timeAgo: string;
    gameMode?: string;
}

class LastGames extends LocalizedComponent {
    private games: GameResult[] = [];
    private isUsingDefaultData = true;

    constructor() {
        super();
        this.games = this.getDefaultGames();
    }

    private getDefaultGames(): GameResult[] {
        return [
            {
                id: "1",
                opponent: "PlayerX",
                result: "win",
                playerScore: 7,
                opponentScore: 5,
                timeAgo: t("last_games_time_hours_ago", { count: 2 }),
                gameMode: "ranked"
            },
            {
                id: "2",
                opponent: "Irfan",
                result: "loss",
                playerScore: 4,
                opponentScore: 7,
                timeAgo: t("last_games_time_hours_ago", { count: 5 }),
                gameMode: "casual"
            },
            {
                id: "3",
                opponent: "GameMaster",
                result: "win",
                playerScore: 7,
                opponentScore: 3,
                timeAgo: t("last_games_time_days_ago", { count: 1 }),
                gameMode: "tournament"
            }
        ];
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
        if (this.isUsingDefaultData) {
            this.games = this.getDefaultGames();
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
                    <button id="viewAllGamesBtn" class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 min-h-[44px]">
                        ${t("last_games_view_all")}
                    </button>
                </div>
                <div id="gamesContainer" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    ${this.generateGamesHTML()}
                </div>
            </div>
        `;
    }

    protected afterRender(): void {
        this.setupEvents();
    }

    private generateGamesHTML(): string {
        return this.games.map(game => {
            const resultClass = game.result === 'win' 
                ? 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' 
                : 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
            
            const resultIcon = game.result === 'win' ? '🏆' : '😞';
            const resultText = game.result === 'win' ? t("last_games_result_win") : t("last_games_result_loss");
            
            const { label: gameModeLabel, icon: gameModeIcon } = this.translateGameMode(game.gameMode);
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105" data-game-id="${game.id}">
                    <!-- Header with opponent and result -->
                    <div class="flex justify-between items-center gap-2 mb-4">
                        <div class="flex items-center space-x-2 min-w-0">
                            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-sm font-bold text-blue-600 dark:text-blue-400">${game.opponent.charAt(0).toUpperCase()}</span>
                            </div>
                            <span class="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">${game.opponent}</span>
                        </div>
                        <div class="flex items-center space-x-1 ${resultClass} px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-bold whitespace-nowrap">
                            <span>${resultIcon}</span>
                            <span>${resultText}</span>
                        </div>
                    </div>
                    
                    <!-- Score -->
                    <div class="text-center mb-4">
                        <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            <span class="${game.result === 'win' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}">${game.playerScore}</span>
                            <span class="text-gray-400 mx-2">-</span>
                            <span class="${game.result === 'loss' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}">${game.opponentScore}</span>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">${t("last_games_final_score")}</div>
                    </div>
                    
                    <!-- Footer with time and game mode -->
                    <div class="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <span class="text-xs">⏰</span>
                            <span class="text-xs font-medium">${game.timeAgo}</span>
                        </div>
                        ${gameModeLabel ? `
                            <div class="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span class="text-xs">${gameModeIcon}</span>
                                <span class="text-xs font-semibold">${gameModeLabel}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    private setupEvents(): void {
        // View All Games button click
        const viewAllGamesBtn = this.querySelector('#viewAllGamesBtn');
        viewAllGamesBtn?.addEventListener('click', () => {
            this.handleViewAllGames();
        });

        // Game item clicks
        const gameItems = this.querySelectorAll('[data-game-id]');
        gameItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const gameId = (e.currentTarget as HTMLElement).getAttribute('data-game-id');
                this.handleGameClick(gameId);
            });
        });
    }

    // Event Handler Methods - İçleri boş, sen dolduracaksın
    private handleViewAllGames(): void {
        // TODO: Navigate to full games history page
    }

    private handleGameClick(gameId: string | null): void {
        // TODO: Show detailed game info
        void gameId;
    }

    // Update Methods - İçleri boş, sen dolduracaksın
    public updateGames(games: GameResult[]): void {
        // Oyun listesini güncelle
        this.isUsingDefaultData = false;
        this.games = games;
        this.renderAndBind();
    }

    public addGame(game: GameResult): void {
        // Yeni oyun ekle (en başa)
        this.isUsingDefaultData = false;
        this.games.unshift(game);
        // Sadece son 10 oyunu tut
        if (this.games.length > 10) {
            this.games = this.games.slice(0, 10);
        }
        this.renderAndBind();
    }

    public refreshGames(): Promise<void> {
        // Oyunları API'dan yenile
        return new Promise((resolve) => {
            // TODO: Refresh games from API
            resolve();
        });
    }

    // Data Loading Methods - İçleri boş, sen dolduracaksın
    public async loadRecentGames(): Promise<void> {
        // API'dan son oyunları yükle
        try {
            // API call buraya eklenecek
        } catch (error) {
            console.error(t("last_games_load_error_log"), error);
        }
    }

    // Utility Methods - İçleri boş, sen dolduracaksın
    public clearGames(): void {
        // Tüm oyunları temizle
        this.isUsingDefaultData = false;
        this.games = [];
        this.renderAndBind();
    }

    public getGamesByResult(result: 'win' | 'loss'): GameResult[] {
        // Sonuca göre oyunları filtrele
        return this.games.filter(game => game.result === result);
    }

    public getWinLossStats(): { wins: number; losses: number; winRate: number } {
        // Kazanma/kaybetme istatistikleri
        const wins = this.getGamesByResult('win').length;
        const losses = this.getGamesByResult('loss').length;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        
        return { wins, losses, winRate };
    }

    // Getter Methods
    public getGames(): GameResult[] {
        return [...this.games];
    }

    public getGameById(id: string): GameResult | undefined {
        return this.games.find(game => game.id === id);
    }
}

customElements.define("last-games-component", LastGames);
