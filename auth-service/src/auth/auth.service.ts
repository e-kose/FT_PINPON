import { registerUserBody } from "./types/register.userBody.js";
import { db } from "../run.migrations.js";
import { checkHash, hashTransaction } from "./utils/hash.utils.js";
import {
  InvalidCredentials,
  InvalidToken,
  UserAlreadyExists,
  UserNotFound,
} from "../errors/auth.errors.js";
import { loginUserBody } from "./types/login.userBody.js";
import { User } from "./types/userDB.js";
import { payload } from "./types/payload.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { genarateTokens } from "./utils/tokens.utils.js";

export async function registerService(body: registerUserBody) {
  const stmt = db.prepare(
    "INSERT INTO users (username, password, email) VALUES(?,?,?)"
  );
  const { success, user } = findUserUsername(body.username);
  if (success && user) throw new UserAlreadyExists();
  const hashedPass = await hashTransaction(body.password);
  stmt.run(body.username, hashedPass, body.email);
  return { succes: true , message:'User successfully created' };
}

export async function loginUserService(
  app: FastifyInstance,
  body: loginUserBody
) {
  const result = body.email
    ? findUserUserEmail(body.email!)
    : findUserUsername(body.username!);
  if (!result.success || !result.user) throw new UserNotFound();
  const checkedPass = await checkHash(body.password, result.user.password);
  if (!checkedPass) throw new InvalidCredentials();
  const payload: payload = {
    id: result.user.id,
    email: result.user.email,
    username: result.user.username,
  };
  const { accesstoken, refreshtoken } = await genarateTokens(app, payload);
  const { password, ...userWithoutPassword } = result.user;
  await updateRefreshToken(payload.id, refreshtoken);
  return { user: userWithoutPassword, accesstoken, refreshtoken};
}

export async function refreshTokenService(req : FastifyRequest) {
  const userId = (req.user as payload).id;
  const refreshRecord = findRefreshTokensUserId(userId);
  if(!refreshRecord.success) throw new InvalidToken();
  const isValid = await checkHash(req.cookies?.refresh_token,refreshRecord.tokenRecord as string);
  if(!isValid) throw new InvalidToken();
  const {accesstoken, refreshtoken} = await genarateTokens(req.server, req.user as payload);
  await updateRefreshToken(userId, refreshtoken);
  return({accesstoken, refreshtoken});
}

export function findUserUsername(userName: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE username= ?");
  const user = stmt.get(userName) as User;
  if (user) return { success: true, user };
  return { success: false, user: null };
}

export async function   logoutService(req:FastifyRequest) {
  const userId = (req.user as payload).id;
  const result = await updateRefreshToken(userId, '');
  return result;
}

export async function updateRefreshToken(id : number, refreshToken: string) {
  let hashRefresh = '';
  const refreshRecord = db.prepare("SELECT * FROM refresh_tokens WHERE user_id=?").get(id);
  if(refreshToken !== '')
    hashRefresh = await hashTransaction(refreshToken);
  if(refreshRecord){
    db.prepare("UPDATE refresh_tokens SET token=? WHERE user_id=?").run(hashRefresh, id);
  }else{
    db.prepare("INSERT INTO refresh_tokens (user_id, token) VALUES(?,?)").run(id, hashRefresh);
  }
  return { success: true }
}

export function findUserUserEmail(email: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE email= ?");
  const user = stmt.get(email) as User;
  if (user) return { success: true, user };
  return { success: false, user: null };
}

export function findUserUserId(id: number) {
  const stmt = db.prepare("SELECT * FROM users WHERE id= ?");
  const user = stmt.get(id) as User;
  if (user) return { success: true, user };
  return { success: false, user: null };
}

export function findRefreshTokensUserId(id : number){
  const tokenRecord = db.prepare("SELECT * FROM refresh_tokens WHERE user_id=?").get(id);
  if(tokenRecord)  return { success: true, tokenRecord };
  return { success: false, tokenRecord: null }; 
}

