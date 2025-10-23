import BetterSqlite3 from "better-sqlite3";

export class FriendshipRepository {
  db: BetterSqlite3.Database;
  constructor(db: BetterSqlite3.Database) {
    this.db = db;
  }

  createRequest(userId: number, friendId: number) {
    const stmt = this.db.prepare(
      "INSERT INTO friendships(user_id, friend_id, status) VALUES(?,?, 'pending')"
    );
    const info = stmt.run(userId, friendId);
    return info.lastInsertRowid;
  }

  getFriendshipBetween(userId: number, friendId: number) {
    const stmt = this.db.prepare(
      "SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)"
    );
    return stmt.get(userId, friendId, friendId, userId);
  }

  updateStatus(id: number, status: string) {
    const stmt = this.db.prepare("UPDATE friendships SET status = ? WHERE id = ?");
    return stmt.run(status, id);
  }

  deleteFriendship(id: number) {
    const stmt = this.db.prepare("DELETE FROM friendships WHERE id = ?");
    return stmt.run(id);
  }

  listFriends(userId: number) {
    const stmt = this.db.prepare(
    `SELECT
      f.id AS id,
      (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) AS friend_id,
      u.username AS friend_username,
      u.email AS friend_email
       FROM friendships f
       JOIN users u ON u.id = (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END)
       WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'`
    );
    return stmt.all(userId, userId, userId, userId);
  }

  listRequests(userId: number) {
    const stmt = this.db.prepare(
      `SELECT f.*, u.username AS requester_username, u.email AS requester_email
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = ? AND f.status = 'pending'`
    );
    return stmt.all(userId);
  }

  listSentRequests(userId: number) {
    const stmt = this.db.prepare(
      `SELECT f.*, u.username AS target_username, u.email AS target_email
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ? AND f.status = 'pending'`
    );
    return stmt.all(userId);
  }

  // Blocking API
  createBlock(blocker_id: number, blocked_id: number) {
    const stmt = this.db.prepare(
      "INSERT OR IGNORE INTO blocked_users(blocker_id, blocked_id) VALUES(?, ?)"
    );
    const res = stmt.run(blocker_id, blocked_id);
    return res.lastInsertRowid;
  }

  getBlockedList(blocker_id: number) {
    const stmt = this.db.prepare(
      `SELECT b.blocked_id AS id, u.username, u.email FROM blocked_users b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ?`
    );
    return stmt.all(blocker_id);
  }

  isBlocked(blocker_id: number, blocked_id: number) {
    const stmt = this.db.prepare(
      "SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?"
    );
    return stmt.get(blocker_id, blocked_id);
  }

  deleteBlock(blocker_id: number, blocked_id: number) {
    const stmt = this.db.prepare(
      "DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?"
    );
    const res = stmt.run(blocker_id, blocked_id);
    return res.changes;
  }

  getFriendshipById(id: number) {
    const stmt = this.db.prepare("SELECT * FROM friendships WHERE id = ?");
    return stmt.get(id);
  }
}
