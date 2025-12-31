import { t } from "../../i18n/lang";
import { LocalizedComponent } from "../base/LocalizedComponent";

interface UserStats {
    wins: number;
    losses: number;
    rank: string;
    winRate?: number;
}

class Statistics extends LocalizedComponent {
    private userStats: UserStats = {
        wins: 12,
        losses: 8,
        rank: "Silver",
        winRate: 60
    };

    protected renderComponent(): void {
        const winRate = this.userStats.winRate ?? 0;
        this.calculateWinRate();
        this.innerHTML = `
            <div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl shadow-xl border border-white/20 p-4 sm:p-6">
                <div class="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h3 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center break-words">
                        <span class="mr-3 text-2xl">📊</span>
                        ${t("statistics_heading")}
                    </h3>
                </div>
                <div id="userStatsContainer" class="space-y-3 sm:space-y-4">
                    ${this.generateStatsHTML()}
                </div>
                
                <!-- Win Rate Circle -->
                <div class="mt-5 sm:mt-6 flex justify-center">
                    <div class="relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36" role="img" aria-label="${t("statistics_win_rate_label")}">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-gray-300 dark:stroke-gray-600" stroke-width="3"></circle>
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-blue-600 dark:stroke-blue-400" stroke-width="3" stroke-dasharray="${winRate}, ${100 - winRate}" stroke-linecap="round"></circle>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${winRate}%</span>
                        </div>
                    </div>
                </div>
                <p class="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">${t("statistics_win_rate_label")}</p>
            </div>
        `;
    }

    private generateStatsHTML(): string {
        return `
            <!-- Wins Card -->
            <div class="bg-green-50/80 backdrop-blur-sm dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-lg p-3 sm:p-4 hover:bg-green-100/80 dark:hover:bg-green-900/40 hover:border-green-300/60 dark:hover:border-green-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-green-100/80 dark:bg-green-800/80 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <span class="text-green-600 dark:text-green-400 text-lg">🏆</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("statistics_card_wins_label")}</p>
                            <p class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">${this.userStats.wins}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Losses Card -->
            <div class="bg-red-50/80 backdrop-blur-sm dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-lg p-3 sm:p-4 hover:bg-red-100/80 dark:hover:bg-red-900/40 hover:border-red-300/60 dark:hover:border-red-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-red-100/80 dark:bg-red-800/80 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <span class="text-red-600 dark:text-red-400 text-lg">💔</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("statistics_card_losses_label")}</p>
                            <p class="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">${this.userStats.losses}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rank Card -->
            <div class="bg-yellow-50/80 backdrop-blur-sm dark:bg-yellow-900/30 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg p-3 sm:p-4 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/40 hover:border-yellow-300/60 dark:hover:border-yellow-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-100/80 dark:bg-yellow-800/80 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <span class="text-yellow-600 dark:text-yellow-400 text-lg">⭐</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${t("statistics_card_rank_label")}</p>
                            <p class="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400">${this.userStats.rank}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private calculateWinRate(): void {
        const totalGames = this.userStats.wins + this.userStats.losses;
        if (totalGames > 0) {
            this.userStats.winRate = Math.round((this.userStats.wins / totalGames) * 100);
        } else {
            this.userStats.winRate = 0;
        }
    }

    // Update Methods - İçleri boş, sen dolduracaksın
    public updateStats(stats: Partial<UserStats>): void {
        // İstatistikleri güncelle
        this.userStats = { ...this.userStats, ...stats };
        this.calculateWinRate();
        
        // DOM'u yeniden render et
        this.renderAndBind();
    }

    public refreshStats(): Promise<void> {
        // İstatistikleri API'dan yenile
        return new Promise((resolve) => {
            // TODO: API call for refreshing stats
            resolve();
        });
    }

    // Data Loading Methods - İçleri boş, sen dolduracaksın
    public async loadUserStats(): Promise<void> {
        // API'dan kullanıcı istatistiklerini yükle
        try {
            // API call buraya eklenecek
        } catch (error) {
            console.error(t("statistics_load_error_log"), error);
        }
    }

    // Getter Methods
    public getStats(): UserStats {
        return { ...this.userStats };
    }

    public getWinRate(): number {
        return this.userStats.winRate || 0;
    }
}

customElements.define("statistics-component", Statistics);
