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
      "INSERT INTO users(username, email, password) VALUES (?,?,?)"
    );
    const info = insertUser.run(
      user.username,
      user.email,
      user.password || null
    );
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

  /**
   * Update table by given column (default: user_id)
   * @param tableName - Table to update
   * @param id - Value for WHERE column
   * @param data - Fields to update
   * @param whereColumn - Column name for WHERE (default: 'user_id')
   */
  updateTable(
    tableName: string,
    id: number,
    data: Record<string, any>,
    whereColumn: string = "user_id"
  ) {
    const keys = Object.keys(data);
    if (keys.length === 0) return 0;

     const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = keys.map((key) => {
      const value = data[key];
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return value;
    });

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereColumn} = ?`;
    const stmt = this.db.prepare(sql);
    try {
      return stmt.run(...values, id);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Dynamically inserts data into a table.
   * @param tableName - Name of the table
   * @param data - Fields and values to insert
   * @returns The last inserted row id
   */
  insertTable(tableName: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...values);
    return info.lastInsertRowid;
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

  getFullTableById(id: number) {
    const stmt = this.db
      .prepare(`SELECT u.id, u.username, u.email, u.is_2fa_enabled, p.*
      FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = ?`);
    return stmt.get(id);
  }

  getFullTableByEmail(email: string) {
    const stmt = this.db
      .prepare(`SELECT u.id, u.username, u.email, u.is_2fa_enabled, p.*
      FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.email = ?`);
    return stmt.get(email);
  }

  getFullTableByUsername(username: string) {
    const stmt = this.db
      .prepare(`SELECT u.id, u.username, u.email, u.is_2fa_enabled, p.*
      FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.username = ?`);
    return stmt.get(username);
  }

  deleteUser(id: number) {
    const stmt = this.db.prepare("DELETE FROM users WHERE id = ?");
    return stmt.run(id);
  }

  getProfileById(id: number) {
    const stmt = this.db.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    );
    return stmt.get(id);
  }

  getUserSummaryById(id: number) {
    const stmt = this.db.prepare(
      `SELECT u.id AS user_id, u.username AS username, p.full_name AS full_name, p.avatar_url AS avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`
    );
    return stmt.get(id);
  }


  listUsers() {
    const stmt = this.db.prepare("SELECT * FROM users");
    return stmt.all();
  }

  updateUser(id: number, data: Record<string, any>) {
    let profileRes, userRes;
    const { profile, ...userFields } = data;
    if (profile && Object.keys(profile).length > 0) {
      profileRes = this.updateTable("user_profiles", id, profile, "user_id");
    }
    if (userFields && Object.keys(userFields).length > 0) {
      userRes = this.updateTable("users", id, userFields, "id");
    }
    return { userRes, profileRes };
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
