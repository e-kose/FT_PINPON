import BetterSqlite3 from "better-sqlite3";
import { CreateProfileType } from "../types/table.types/createProfile.type";
import { registerUserBody } from "../types/table.types/register.userBody";
import { User } from "../types/table.types/userDB";

export class UserRepository {
  db: BetterSqlite3.Database;
  constructor(db: BetterSqlite3.Database) {
    this.db = db;
  }

  createUser(user: registerUserBody) {
    const insertUser = this.db.prepare(
      "INSERT INTO users(username,email,password) VALUES (?,?,?)"
    );
    const info = insertUser.run(user.username, user.email, user.password);
    return info.lastInsertRowid;
  }

  createProfile(id: number | bigint, profile: CreateProfileType) {
    const insertProfile = this.db.prepare(
      "INSERT INTO user_profiles(user_id, full_name, bio, avatar_url) VALUES(?,?,?,?)"
    );
    insertProfile.run(id, profile.full_name, profile.bio, profile.avatar_url);
  }

  createOAuth(id: number, outh_id: string) {
    const insertOAuth = this.db.prepare(
      "INSERT INTO user_oauth(user_id, oauth_id) VALUES(?,?)"
    );
    insertOAuth.run(id, outh_id);
  }

  create2faAndSecurity(id: number) {
    const instert2fa = this.db.prepare(
      "INSERT INTO user_2fa(user_id) VALUES(?)"
    );
    instert2fa.run(id);
    const instertSecurity = this.db.prepare(
      "INSERT INTO user_security(user_id) VALUES(?)"
    );
    instertSecurity.run(id);
  }

  updateTable(tableName: string, id: number, data: Record<string, any>) {
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;

    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = keys.map((key) => data[key]);

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    const stmt = this.db.prepare(sql);

    const info = stmt.run(values, id);
  }

  getUserById(id: number) {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(id) as User;
  }
  getUserByUsername(username: string) {
    const stmt = this.db.prepare("SELECT * FROM users WHERE username = ?");
    return stmt.get(username) as User;
  }
  getUserByEmail(email: string) {
    const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email) as User;
  }
  deleteUser(id: number) {
    const stmt = this.db.prepare("DELETE FROM users WHERE id = ?");
    return stmt.run(id);
  }
  listUsers() {
    const stmt = this.db.prepare("SELECT * FROM users");
    return stmt.all();
  }
  updateUser(id: number, data: Record<string, any>) {
    return this.updateTable("users", id, data);
  }

  getUserAll(id: number) {
    const stmt = this.db.prepare(`
    SELECT u.*, p*, 
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `);
    return stmt.get(id);
  }
}
