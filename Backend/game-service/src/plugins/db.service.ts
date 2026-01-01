/**
 * Database Service
 * Handles game result persistence for matchmaking games
 */

import Database from 'better-sqlite3';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { GameOverData } from '../game/types/game.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './db/game.db';
    const resDbPath = path.join(__dirname, '../../', dbPath);
    this.db = new Database(resDbPath);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Save matchmaking game result to database
   * Local games are not saved
   */
  public saveGameResult(gameData: GameOverData, mode: string): void {
    // Only save matchmaking games
    if (mode !== 'matchmaking') {
      console.log(`[DB] Skipping local game result: ${gameData.roomId}`);
      return;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO game_results
        (room_id, winner_id, loser_id, winner_score, loser_score, game_mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const winnerScore = gameData.winner === 'left' ? gameData.finalScore.left : gameData.finalScore.right;
      const loserScore = gameData.winner === 'left' ? gameData.finalScore.right : gameData.finalScore.left;

      stmt.run(
        gameData.roomId,
        gameData.winnerId,
        gameData.loserId,
        winnerScore,
        loserScore,
        mode,
        gameData.timestamp
      );

      console.log(`[DB] ✅ Game result saved: ${gameData.roomId} | Winner: ${gameData.winnerId}`);
    } catch (error: any) {
      // Ignore duplicate entries (same room_id)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log(`[DB] Game result already exists: ${gameData.roomId}`);
      } else {
        console.error(`[DB] Failed to save game result:`, error);
        throw error;
      }
    }
  }

  /**
   * Get user statistics
   */
  public getUserStats(userId: string): {
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
  } {
    const winsStmt = this.db.prepare('SELECT COUNT(*) as count FROM game_results WHERE winner_id = ?');
    const lossesStmt = this.db.prepare('SELECT COUNT(*) as count FROM game_results WHERE loser_id = ?');

    const wins = (winsStmt.get(userId) as { count: number }).count;
    const losses = (lossesStmt.get(userId) as { count: number }).count;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return { wins, losses, totalGames, winRate };
  }

  /**
   * Get recent games for a user
   */
  public getUserRecentGames(userId: string, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM game_results
      WHERE winner_id = ? OR loser_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(userId, userId, limit);
  }

  public close(): void {
    this.db.close();
  }
}
