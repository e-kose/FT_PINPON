interface LeaderboardEntry {
    position: number;
    username: string;
    rank: string;
    level?: number;
    xp?: number;
}

class PlayerList extends HTMLElement {
    private leaderboard: LeaderboardEntry[] = [
        { position: 1, username: "PlayerX", rank: "Gold", level: 11, xp: 1240 },
        { position: 2, username: "Irfan", rank: "Silver", level: 12, xp: 1150 },
        { position: 3, username: "Mehmet", rank: "Bronze", level: 13, xp: 1010 }
    ];

    private currentUsername: string = "Mehmet";

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        this.setupEvents();
    }

    disconnectedCallback(): void {
    }

    private render(): void {
        this.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <span class="mr-3 text-2xl">🏅</span>
                        En İyi Oyuncular
                    </h3>
                    <button id="viewAllBtn" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors">
                        Tümünü Gör
                    </button>
                </div>
                <div id="leaderboardContainer" class="space-y-3">
                    ${this.generateLeaderboardHTML()}
                </div>
            </div>
        `;
    }

    private generateLeaderboardHTML(): string {
        return this.leaderboard.map(entry => {
            const isCurrentUser = entry.username === this.currentUsername;
            const positionIcon = entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : entry.position === 3 ? '🥉' : `${entry.position}.`;
            const rankColors = {
                'Gold': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                'Silver': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
                'Bronze': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800'
            };
            
            return `
                <div class="flex items-center justify-between p-4 ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'} rounded-lg hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer transform hover:scale-102" data-username="${entry.username}">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-8 h-8">
                            <span class="text-lg font-bold">${positionIcon}</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <img class="w-10 h-10 rounded-full border-2 ${isCurrentUser ? 'border-blue-400' : 'border-gray-300 dark:border-gray-600'}" 
                                 src="https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=${entry.username.charAt(0)}" 
                                 alt="${entry.username}">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-white ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : ''}">${entry.username}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Level ${entry.level || entry.position + 10}</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">${entry.xp || 1240} XP</span>
                        <span class="px-3 py-1 text-xs font-semibold rounded-full border ${rankColors[entry.rank as keyof typeof rankColors]}">${entry.rank}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    private setupEvents(): void {
        // View All button click
        const viewAllBtn = this.querySelector('#viewAllBtn');
        viewAllBtn?.addEventListener('click', () => {
            this.handleViewAllPlayers();
        });

        // Player item clicks
        const playerItems = this.querySelectorAll('[data-username]');
        playerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const username = (e.currentTarget as HTMLElement).getAttribute('data-username');
                this.handlePlayerClick(username);
            });
        });
    }

    // Event Handler Methods - İçleri boş, sen dolduracaksın
    private handleViewAllPlayers(): void {
        // TODO: Navigate to full leaderboard page
    }

    private handlePlayerClick(username: string | null): void {
        // TODO: Show player profile or stats
    }

    // Update Methods - İçleri boş, sen dolduracaksın
    public updateLeaderboard(leaderboard: LeaderboardEntry[]): void {
        // Leaderboard'u güncelle
        this.leaderboard = leaderboard;
        this.render();
        this.setupEvents();
    }

    public setCurrentUser(username: string): void {
        // Mevcut kullanıcıyı ayarla
        this.currentUsername = username;
        this.render();
        this.setupEvents();
    }

    public refreshLeaderboard(): Promise<void> {
        // Leaderboard'u API'dan yenile
        return new Promise((resolve) => {
            // TODO: Refresh leaderboard from API
            resolve();
        });
    }

    // Data Loading Methods - İçleri boş, sen dolduracaksın
    public async loadLeaderboard(): Promise<void> {
        // API'dan leaderboard verilerini yükle
        try {
            // API call buraya eklenecek
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    // Utility Methods - İçleri boş, sen dolduracaksın
    public addPlayer(player: LeaderboardEntry): void {
        // Yeni oyuncu ekle
        this.leaderboard.push(player);
        this.updateLeaderboard(this.leaderboard);
    }

    public removePlayer(username: string): void {
        // Oyuncu çıkar
        this.leaderboard = this.leaderboard.filter(player => player.username !== username);
        this.updateLeaderboard(this.leaderboard);
    }

    // Getter Methods
    public getLeaderboard(): LeaderboardEntry[] {
        return [...this.leaderboard];
    }

    public getCurrentUser(): string {
        return this.currentUsername;
    }
}

customElements.define("player-list-component", PlayerList);