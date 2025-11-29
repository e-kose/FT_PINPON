import type Database from "better-sqlite3";
import type { Game, GameMode, GameStatus } from "../types/game.types.js";
import { nanoid } from "nanoid";

export class GameRepository {
  constructor(private db: Database.Database) {}

  create(game: Partial<Game>): Game {
    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO games (
        id, game_mode, player1_id, player1_nickname, player2_id, player2_nickname,
        max_score, ball_speed_multiplier, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      game.game_mode || 'local',
      game.player1_id || null,
      game.player1_nickname,
      game.player2_id || null,
      game.player2_nickname,
      game.max_score || 11,
      game.ball_speed_multiplier || 1.0,
      now,
      'waiting'
    );

    return this.findById(id)!;
  }

  findById(id: string): Game | undefined {
    const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?');
    return stmt.get(id) as Game | undefined;
  }

  findAll(filters?: { status?: GameStatus; game_mode?: GameMode; limit?: number; offset?: number }): Game[] {
    let query = 'SELECT * FROM games WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.game_mode) {
      query += ' AND game_mode = ?';
      params.push(filters.game_mode);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Game[];
  }

  findByPlayer(userId: number, filters?: { limit?: number; offset?: number }): Game[] {
    const stmt = this.db.prepare(`
      SELECT * FROM games
      WHERE (player1_id = ? OR player2_id = ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(
      userId,
      userId,
      filters?.limit || 20,
      filters?.offset || 0
    ) as Game[];
  }

  updateStatus(id: string, status: GameStatus): void {
    const now = Math.floor(Date.now() / 1000);
    let stmt;

    if (status === 'playing') {
      stmt = this.db.prepare('UPDATE games SET status = ?, started_at = ? WHERE id = ?');
      stmt.run(status, now, id);
    } else if (status === 'finished') {
      const game = this.findById(id);
      const duration = game?.started_at ? now - game.started_at : 0;
      stmt = this.db.prepare('UPDATE games SET status = ?, finished_at = ?, duration = ? WHERE id = ?');
      stmt.run(status, now, duration, id);
    } else {
      stmt = this.db.prepare('UPDATE games SET status = ? WHERE id = ?');
      stmt.run(status, id);
    }
  }

  updateScore(id: string, player1Score: number, player2Score: number): void {
    const stmt = this.db.prepare(`
      UPDATE games
      SET player1_score = ?, player2_score = ?
      WHERE id = ?
    `);
    stmt.run(player1Score, player2Score, id);
  }

  setWinner(id: string, winnerId: number | null, winnerNickname: string | null): void {
    const stmt = this.db.prepare(`
      UPDATE games
      SET winner_id = ?, winner_nickname = ?
      WHERE id = ?
    `);
    stmt.run(winnerId, winnerNickname, id);
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
    stmt.run(id);
  }

  countActive(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM games
      WHERE status IN ('waiting', 'ready', 'playing')
    `);
    const result = stmt.get() as { count: number };
    return result.count;
  }
}
