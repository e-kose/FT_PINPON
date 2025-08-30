import BetterSqlite from "better-sqlite3";
import type { CreateMessage } from "../types/createMessage.type";
export class MessageRepository {
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

  getConversation(userId1: number, userId2: number, limit: number = 50, offset:number = 0) {
    const messages = this.db
      .prepare(
        "SELECT * FROM messages WHERE (sender_id = ? AND recv_id = ?) OR (sender_id = ? AND recv_id = ?) ORDER BY created_at ASC LIMIT ? OFFSET ?"
      )
      .all(userId1, userId2, userId2, userId1, limit, offset);
    return messages;
  }

  getMessageByRecvierId(recv_id : number, limit:number = 50, offset:number = 0){
	const messages = this.db.prepare(
		"SELECT * FROM messages WHERE recv_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?"
	).all(recv_id, limit, offset);
	return messages;
  }

   getMessageBySenderId(sender_id : number, limit:number = 50, offset:number = 0){
	const messages = this.db.prepare(
		"SELECT * FROM messages WHERE sender_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?"
	).all(sender_id, limit, offset);
	return messages;
  }
}
