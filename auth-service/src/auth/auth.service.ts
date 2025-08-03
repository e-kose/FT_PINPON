import { registerUserBody } from "./types/register.UserBody.js";
import { db } from "../run.migrations.js";
import { hashPassword } from "./utils/hash.utils.js";
import { UserAlreadyExists } from "../errors/auth.errors.js";

export async function registerService(body: registerUserBody) {
  const stmt = db.prepare(
    "INSERT INTO users (username, password, email) VALUES(?,?,?)"
  );
  const { success, user } = findUserUsername(body.username);
  if (success && user) throw new UserAlreadyExists();
  const hashedPass = await hashPassword(body.password);
  stmt.run(body.username, hashedPass, body.email);
  return { succes: true };
}

export function findUserUsername(userName: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE username= ?");
  const user = stmt.get(userName);
  if (user) return { success: true, user };
  return { success: false, user: null };
}