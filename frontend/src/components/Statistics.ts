interface UserStats {
    wins: number;
    losses: number;
    rank: string;
    winRate?: number;
}

class Statistics extends HTMLElement {
    private userStats: UserStats = {
        wins: 12,
        losses: 8,
        rank: "Silver",
        winRate: 60
    };

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        this.calculateWinRate();
    }

    disconnectedCallback(): void {
    }

    private render(): void {
        this.innerHTML = `
            <div class="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-xl shadow-xl border border-white/20 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <span class="mr-3 text-2xl">📊</span>
                        İstatistikleriniz
                    </h3>
                </div>
                <div id="userStatsContainer" class="space-y-4">
                    ${this.generateStatsHTML()}
                </div>
                
                <!-- Win Rate Circle -->
                <div class="mt-6 flex justify-center">
                    <div class="relative w-24 h-24">
                        <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-gray-300 dark:stroke-gray-600" stroke-width="3"></circle>
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-blue-600 dark:stroke-blue-400" stroke-width="3" stroke-dasharray="${this.userStats.winRate}, ${100 - (this.userStats.winRate || 0)}" stroke-linecap="round"></circle>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">${this.userStats.winRate}%</span>
                        </div>
                    </div>
                </div>
                <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Kazanma Oranı</p>
            </div>
        `;
    }

    private generateStatsHTML(): string {
        return `
            <!-- Wins Card -->
            <div class="bg-green-50/80 backdrop-blur-sm dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded-lg p-4 hover:bg-green-100/80 dark:hover:bg-green-900/40 hover:border-green-300/60 dark:hover:border-green-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-green-100/80 dark:bg-green-800/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <span class="text-green-600 dark:text-green-400 text-lg">🏆</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Kazanç</p>
                            <p class="text-2xl font-bold text-green-600 dark:text-green-400">${this.userStats.wins}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Losses Card -->
            <div class="bg-red-50/80 backdrop-blur-sm dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-lg p-4 hover:bg-red-100/80 dark:hover:bg-red-900/40 hover:border-red-300/60 dark:hover:border-red-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-red-100/80 dark:bg-red-800/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <span class="text-red-600 dark:text-red-400 text-lg">💔</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Kaybetme</p>
                            <p class="text-2xl font-bold text-red-600 dark:text-red-400">${this.userStats.losses}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rank Card -->
            <div class="bg-yellow-50/80 backdrop-blur-sm dark:bg-yellow-900/30 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg p-4 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/40 hover:border-yellow-300/60 dark:hover:border-yellow-700/60 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-yellow-100/80 dark:bg-yellow-800/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <span class="text-yellow-600 dark:text-yellow-400 text-lg">⭐</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Rütbe</p>
                            <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">${this.userStats.rank}</p>
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
        this.render();
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
            console.error('Error loading user stats:', error);
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