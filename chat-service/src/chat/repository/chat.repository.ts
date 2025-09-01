import BetterSqlite from "better-sqlite3";
import type { CreateMessage } from "../types/createMessage.type";
export class ChatRepository {
  db: BetterSqlite.Database;
  constructor(db: BetterSqlite.Database) {
    this.db = db;
  }

  createMessage(data: CreateMessage) {
    const insertMessage = this.db.prepare(
      "INSERT INTO messages(sender_id, recv_id, content) VALUES (?, ?, ?)"
    );
    const info = insertMessage.run(data.sender_id, data.recv_id, data.content);
    return info.lastInsertRowid;
  }

  getMessageByID(id: number) {
    const message = this.db
      .prepare("SELECT * FROM messages WHERE id = ?")
      .get(id);
    return message;
  }

  getConversation(
    userId1: number,
    userId2: number,
    limit: number = 50,
    offset: number = 0
  ) {
    const messages = this.db
      .prepare(
        "SELECT * FROM messages WHERE (sender_id = ? AND recv_id = ?) OR (sender_id = ? AND recv_id = ?) ORDER BY created_at ASC LIMIT ? OFFSET ?"
      )
      .all(userId1, userId2, userId2, userId1, limit, offset);
    return messages;
  }

  getMessageByRecvierId(
    recv_id: number,
    limit: number = 50,
    offset: number = 0
  ) {
    const messages = this.db
      .prepare(
        "SELECT * FROM messages WHERE recv_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?"
      )
      .all(recv_id, limit, offset);
    return messages;
  }

  getMessageBySenderId(
    sender_id: number,
    limit: number = 50,
    offset: number = 0
  ) {
    const messages = this.db
      .prepare(
        "SELECT * FROM messages WHERE sender_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?"
      )
      .all(sender_id, limit, offset);
    return messages;
  }

  createBlock(blocking_id: number, blocked_id: number) {
    const info = this.db
      .prepare(
        "INSERT INTO blocked_users(blocking_id, blocked_id) VALUES(?, ?)"
      )
      .run(blocking_id, blocked_id);
    return info.lastInsertRowid;
  }

  getBlockUserList(blocking_id: number) {
    const blockList = this.db
      .prepare("SELECT * FROM blocked_users WHERE blocking_id = ?")
      .all(blocking_id);
    return blockList;
  }
  getBlockUserOne(blocking_id: number, blocked_id: number) {
    const block = this.db
      .prepare(
        "SELECT * FROM blocked_users WHERE blocking_id = ? AND blocked_id = ?"
      )
      .get(blocking_id, blocked_id);
    return block;
  }
  getBlockBetweenTwoUser(user1: number, user2: number) {
    const block = this.db
      .prepare(
        "SELECT * FROM blocked_users WHERE (blocking_id = ? AND blocked_id = ?) OR (blocking_id= ? AND blocked_id = ?)"
      )
      .get(user1, user2, user2, user1);
    return block;
  }
  deleteBlock(blocking_id: number, blocked_id: number) {
    const res = this.db
      .prepare(
        "DELETE FROM blocked_users WHERE (blocking_id = ? AND blocked_id = ?)"
      )
      .run(blocking_id, blocked_id);
      return res.changes;
  }
}
