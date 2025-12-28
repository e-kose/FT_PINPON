import type { StatsRepository } from "../repository/stats.repository.js";
import type { GameStats } from "../types/game.types.js";

export class StatsService {
  constructor(private statsRepo: StatsRepository) {}

  /**
   * Get user statistics
   */
  getUserStats(userId: number): GameStats | undefined {
    return this.statsRepo.findByUserId(userId);
  }

  /**
   * Get or create user statistics
   */
  getOrCreateUserStats(userId: number): GameStats {
    return this.statsRepo.getOrCreate(userId);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(
    sortBy: 'rank_points' | 'wins' | 'win_streak' = 'rank_points',
    limit: number = 20,
    offset: number = 0
  ): GameStats[] {
    return this.statsRepo.getLeaderboard(sortBy, limit, offset);
  }

  /**
   * Calculate win rate
   */
  calculateWinRate(stats: GameStats): number {
    if (stats.total_games === 0) return 0;
    return (stats.wins / stats.total_games) * 100;
  }

  /**
   * Get rank tier name
   */
  getRankTierName(rankPoints: number): string {
    if (rankPoints >= 2000) return 'Diamond';
    if (rankPoints >= 1500) return 'Platinum';
    if (rankPoints >= 1200) return 'Gold';
    if (rankPoints >= 900) return 'Silver';
    return 'Bronze';
  }

  /**
   * Get user ranking position
   */
  getUserRanking(userId: number): number | null {
    const leaderboard = this.statsRepo.getLeaderboard('rank_points', 1000, 0);
    const index = leaderboard.findIndex(stat => stat.user_id === userId);
    return index >= 0 ? index + 1 : null;
  }

  /**
   * Get enriched user stats with calculated fields
   */
  getEnrichedUserStats(userId: number): any {
    const stats = this.getUserStats(userId);
    if (!stats) return null;

    return {
      ...stats,
      win_rate: this.calculateWinRate(stats),
      rank_tier_name: this.getRankTierName(stats.rank_points),
      ranking_position: this.getUserRanking(userId),
      average_score: stats.total_games > 0 ? stats.total_score / stats.total_games : 0,
    };
  }
}
