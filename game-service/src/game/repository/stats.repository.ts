import type Database from "better-sqlite3";
import type { GameStats, RankTier } from "../types/game.types.js";

export class StatsRepository {
  constructor(private db: Database.Database) {}

  findByUserId(userId: number): GameStats | undefined {
    const stmt = this.db.prepare('SELECT * FROM game_stats WHERE user_id = ?');
    return stmt.get(userId) as GameStats | undefined;
  }

  create(userId: number): GameStats {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare(`
      INSERT INTO game_stats (user_id, updated_at)
      VALUES (?, ?)
    `);
    stmt.run(userId, now);
    return this.findByUserId(userId)!;
  }

  getOrCreate(userId: number): GameStats {
    let stats = this.findByUserId(userId);
    if (!stats) {
      stats = this.create(userId);
    }
    return stats;
  }

  incrementGames(userId: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET total_games = total_games + 1,
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  recordWin(userId: number, score: number, opponentScore: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET wins = wins + 1,
          total_score = total_score + ?,
          total_score_against = total_score_against + ?,
          current_win_streak = current_win_streak + 1,
          best_win_streak = MAX(best_win_streak, current_win_streak + 1),
          highest_score_in_game = MAX(highest_score_in_game, ?),
          rank_points = rank_points + ?,
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    const pointsGain = 25; // Base points for a win
    stmt.run(score, opponentScore, score, pointsGain, userId);
    this.updateRankTier(userId);
  }

  recordLoss(userId: number, score: number, opponentScore: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET losses = losses + 1,
          total_score = total_score + ?,
          total_score_against = total_score_against + ?,
          current_win_streak = 0,
          rank_points = MAX(0, rank_points - ?),
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    const pointsLoss = 15; // Points lost for a loss
    stmt.run(score, opponentScore, pointsLoss, userId);
    this.updateRankTier(userId);
  }

  recordDraw(userId: number, score: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET draws = draws + 1,
          total_score = total_score + ?,
          total_score_against = total_score_against + ?,
          current_win_streak = 0,
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    stmt.run(score, score, userId);
  }

  private updateRankTier(userId: number): void {
    const stats = this.findByUserId(userId);
    if (!stats) return;

    let tier: RankTier = 'bronze';
    if (stats.rank_points >= 2000) tier = 'diamond';
    else if (stats.rank_points >= 1500) tier = 'platinum';
    else if (stats.rank_points >= 1200) tier = 'gold';
    else if (stats.rank_points >= 900) tier = 'silver';

    const stmt = this.db.prepare('UPDATE game_stats SET rank_tier = ? WHERE user_id = ?');
    stmt.run(tier, userId);
  }

  getLeaderboard(sortBy: 'rank_points' | 'wins' | 'win_streak' = 'rank_points', limit: number = 20, offset: number = 0): GameStats[] {
    let orderColumn = 'rank_points';
    if (sortBy === 'wins') orderColumn = 'wins';
    if (sortBy === 'win_streak') orderColumn = 'best_win_streak';

    const stmt = this.db.prepare(`
      SELECT * FROM game_stats
      ORDER BY ${orderColumn} DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as GameStats[];
  }

  incrementTournamentPlayed(userId: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET tournaments_played = tournaments_played + 1,
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  incrementTournamentWon(userId: number): void {
    const stmt = this.db.prepare(`
      UPDATE game_stats
      SET tournaments_won = tournaments_won + 1,
          rank_points = rank_points + 100,
          updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    stmt.run(userId);
    this.updateRankTier(userId);
  }
}
