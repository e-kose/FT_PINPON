import type Database from "better-sqlite3";
import type { GameInvite, InviteStatus } from "../types/game.types.js";
import { nanoid } from "nanoid";

export class InviteRepository {
  constructor(private db: Database.Database) {}

  create(invite: Partial<GameInvite>): GameInvite {
    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (5 * 60); // 5 minutes expiry

    const stmt = this.db.prepare(`
      INSERT INTO game_invites (
        id, from_user_id, from_nickname, to_user_id, to_nickname,
        max_score, status, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    stmt.run(
      id,
      invite.from_user_id,
      invite.from_nickname,
      invite.to_user_id,
      invite.to_nickname || null,
      invite.max_score || 11,
      expiresAt,
      now
    );

    return this.findById(id)!;
  }

  findById(id: string): GameInvite | undefined {
    const stmt = this.db.prepare('SELECT * FROM game_invites WHERE id = ?');
    return stmt.get(id) as GameInvite | undefined;
  }

  findPendingByUser(userId: number): GameInvite[] {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare(`
      SELECT * FROM game_invites
      WHERE to_user_id = ? AND status = 'pending' AND expires_at > ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, now) as GameInvite[];
  }

  findSentByUser(userId: number): GameInvite[] {
    const stmt = this.db.prepare(`
      SELECT * FROM game_invites
      WHERE from_user_id = ? AND status = 'pending'
      ORDER BY created_at DESC
    `);
    return stmt.all(userId) as GameInvite[];
  }

  updateStatus(id: string, status: InviteStatus, gameId?: string): void {
    const now = Math.floor(Date.now() / 1000);

    if (gameId) {
      const stmt = this.db.prepare(`
        UPDATE game_invites
        SET status = ?, game_id = ?, responded_at = ?
        WHERE id = ?
      `);
      stmt.run(status, gameId, now, id);
    } else {
      const stmt = this.db.prepare(`
        UPDATE game_invites
        SET status = ?, responded_at = ?
        WHERE id = ?
      `);
      stmt.run(status, now, id);
    }
  }

  expireOldInvites(): number {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare(`
      UPDATE game_invites
      SET status = 'expired'
      WHERE status = 'pending' AND expires_at < ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM game_invites WHERE id = ?');
    stmt.run(id);
  }
}
