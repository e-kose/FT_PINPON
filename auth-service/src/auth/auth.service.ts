import { registerUserBody } from "./types/register.userBody.js";
import { db } from "../run.migrations.js";
import { checkPass, hashPassword } from "./utils/hash.utils.js";
import {
  InvalidCredentials,
  UserAlreadyExists,
  UserNotFound,
} from "../errors/auth.errors.js";
import { loginUserBody } from "./types/login.userBody.js";
import { User } from "./types/user.js";
import { payload } from "./types/payload.js";
import { FastifyInstance } from "fastify";
import { genarateTokens } from "./utils/tokens.utils.js";

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

export async function loginUserService(
  app: FastifyInstance,
  body: loginUserBody
) {
  const result = body.email
    ? findUserUserEmail(body.email!)
    : findUserUsername(body.username!);
  if (!result.success || !result.user) throw new UserNotFound();
  const checkedPass = await checkPass(body.password, result.user.password);
  if (!checkedPass) throw new InvalidCredentials();
  const payload: payload = {
    id: result.user.id,
    email: result.user.email,
    username: result.user.username,
  };
  const { accestoken } = await genarateTokens(app, payload);
  const { password, ...userWithoutPassword } = result.user;
  return { user: userWithoutPassword, accestoken };
}

export function findUserUsername(userName: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE username= ?");
  const user = stmt.get(userName) as User;
  if (user) return { success: true, user };
  return { success: false, user: null };
}
function findUserUserEmail(email: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE email= ?");
  const user = stmt.get(email) as User;
  if (user) return { success: true, user };
  return { success: false, user: null };
}
