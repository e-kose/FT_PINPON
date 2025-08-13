import { checkHash, hashTransaction } from "./utils/hash.utils.js";import type { Database } from "better-sqlite3";
import { loginUserBody } from "./types/login.userBody.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { genarateTokens } from "./utils/tokens.utils.js";
import { refreshTokenDB } from "./types/refreshTokenDB.js";
import { generateRandom4Digit } from "./utils/parseDuration.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { auth_tableDb } from "./types/authDb.js";
import { InvalidCredentials, InvalidToken } from "./errors/auth.errors.js";
import { payload } from "./types/payload.js";

export async function loginUserService(
  response : any, req : FastifyRequest
) {
  const body = req.body as loginUserBody;
  const db = req.server.db;

  const authValues = getAuthTable(db, response.data.id);
  if (authValues && authValues.twofa_secret) {
    console.log(authValues.twofa_secret)
      if (!body.token) throw new InvalidCredentials();
      const speakeasy = (await import("speakeasy")).default;
      const verified = speakeasy.totp.verify({
        secret: authValues.twofa_secret,
        encoding: "base32",
        token: body.token,
        window: 1,
      });
      if (!verified) throw new InvalidToken();
    }
    const payload: payload = {
      id: response.data.id,
      email: response.data.email,
      username: response.data.username,
    };
    const { accesstoken, refreshtoken } = await genarateTokens(req.server, payload);
    const { password, twofa_secret, ...userWithoutPassword } = response.data;
    await updateRefreshToken(db,payload.id, refreshtoken);
  return { user: userWithoutPassword, accesstoken, refreshtoken };
}


export function getAuthTable(db : Database, id : number){
  const value = db.prepare("SELECT * FROM auth_table WHERE user_id=?").get(id);
  return value as auth_tableDb;
}
export async function refreshTokenService(req: FastifyRequest) {
  const user = req.user as payload;
  const refreshRecord = findRefreshTokensUserId(req.server.db, user.id);
  if (!refreshRecord.success) throw new InvalidToken();
  const isValid = await checkHash(
    req.cookies?.refresh_token,
    refreshRecord.tokenRecord?.token as string
  );
  if (!isValid) throw new InvalidToken();
    const payload: payload = {
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const { accesstoken, refreshtoken } = await genarateTokens(
    req.server,
    payload
  );

  await updateRefreshToken(req.server.db, user.id, refreshtoken);
  return { accesstoken, refreshtoken };
}

// export function findUserUsername(userName: string) {
//   const stmt = db.prepare("SELECT * FROM users WHERE username= ?");
//   const user = stmt.get(userName) as User;
//   if (user) return { success: true, user };
//   return { success: false, user: null };
// }

export async function logoutService(req: FastifyRequest) {
  const userId = (req.user as payload).id;
  const result = await updateRefreshToken(req.server.db, userId, "");
  return result;
}

// export async function getMeService(req: FastifyRequest) {
//   const userId = (req.user as User).id;
//   const user = findUserUserId(userId);
//   if (!user.success && !user.user) throw new UserNotFound();
//   return user;
// }

// export async function googleAuthService(
//   app: FastifyInstance,
//   req: FastifyRequest
// ) {
//   const token = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
//     req
//   );
//   const googleUser = await fetch(
//     "https://www.googleapis.com/oauth2/v2/userinfo",
//     {
//       headers: {
//         Authorization: `Bearer ${token.token.access_token}`,
//       },
//     }
//   ).then((res) => res.json());
//   const emailIsExist = findUserUserEmail(googleUser.email);
//   if (emailIsExist.success) return OAuthLoginService(app, emailIsExist.user!);
//   else {
//     let userName = googleUser.email.split("@")[0];
//     while (true) {
//       let isExist = findUserUsername(userName);
//       if (!isExist.success) break;
//       else userName = userName + generateRandom4Digit();
//     }
//     return await OAuthRegister(app, userName, googleUser);
//   }
// }

export async function updateRefreshToken(db: Database, id: number, refreshToken: string) {
  let hashRefresh = "";
  const refreshRecord = db
    .prepare("SELECT * FROM refresh_tokens WHERE user_id=?")
    .get(id);  
  if (refreshToken !== "") hashRefresh = await hashTransaction(refreshToken);
  if (refreshRecord) {
    db.prepare("UPDATE refresh_tokens SET token=? WHERE user_id=?").run(
      hashRefresh,
      id
    );
  } else {
    db.prepare("INSERT INTO refresh_tokens (user_id, token) VALUES(?,?)").run(
      id,
      hashRefresh
    );
  }
  return { success: true };
}

// export async function OAuthLoginService(app: FastifyInstance, user: User) {
//   const payload: payload = {
//     id: user.id,
//     email: user.email,
//     username: user.username,
//   };
//   const { accesstoken, refreshtoken } = await genarateTokens(app, payload);
//   await updateRefreshToken(payload.id, refreshtoken);
//   const { password, ...safeUser } = user;
//   return { user: safeUser, accesstoken, refreshtoken };
// }

// export async function OAuthRegister(
//   app: FastifyInstance,
//   userName: string,
//   user: any
// ) {
//   db.prepare(
//     "INSERT INTO users (email, username, google_id) VALUES(?,?,?)"
//   ).run(user.email, userName, user.id);
//   const fUser = findUserUsername(userName);
//   return await OAuthLoginService(app, fUser.user!);
// }

// export async function twoFactorSetupService(req: FastifyRequest) {
  //   const user = req.user as User;
  //   const payload: payload = {
    //     id: user.id,
    //     email: user.email,
    //     username: user.username,
    //   };
    //   const secret = speakeasy.generateSecret({
//   name: `FtTranscendence:${user.email}`,
//   issuer: 'FtTranscendence',
//   length: 32
// });
//   db.prepare("UPDATE users SET twofa_secret = ? where id = ?").run(
  //     secret.base32,
  //     payload.id
  //   );
  //   const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url || "");
  //   return { success: true, qr: qrDataUrl };
  // }
  
  // export async function twoFactorEnableService(req: FastifyRequest) {
    //   const user = req.user as User;
    //   const { token } = req.body as { token: string };
    //   const payload: payload = {
      //     id: user.id,
      //     email: user.email,
      //     username: user.username,
      //   };
      //   const row = db
      //   .prepare("SELECT twofa_secret FROM users WHERE id = ?")
      //   .get(payload.id) as User;
      //   if (!row?.twofa_secret) throw new twoFacNotInit();
//   const verified = speakeasy.totp.verify({
//     secret: row.twofa_secret,
//     encoding: "base32",
//     token,
//     window: 1,
//   });
//   if (!verified) throw new InvalidToken();
  
//   db.prepare("UPDATE users SET is_2fa_enabled = 1 WHERE id = ?").run(payload.id);
//   return { success: true, message: "2FA enabled" };
// }

// export async function twoFactorDisableService(req:FastifyRequest) {
//   const payload = req.user as { userId: number };
//   db.prepare('UPDATE users SET twofa_enabled = 0, twofa_secret = NULL WHERE id = ?').run(payload.userId);
//   return ({ success : true, message: '2FA disabled' });
// }

// export function findUserUserEmail(email: string) {
//   const stmt = db.prepare("SELECT * FROM users WHERE email= ?");
//   const user = stmt.get(email) as User;
//   if (user) return { success: true, user };
//   return { success: false, user: null };
// }

// export function findUserUserId(id: number) {
//   const stmt = db.prepare("SELECT * FROM users WHERE id= ?");
//   const user = stmt.get(id) as User;
//   if (user) return { success: true, user };
//   return { success: false, user: null };
// }

export function findRefreshTokensUserId(db : Database, id: number) {
  const tokenRecord = db
    .prepare("SELECT * FROM refresh_tokens WHERE user_id=?")
    .get(id) as refreshTokenDB;
  if (tokenRecord) return { success: true, tokenRecord };
  return { success: false, tokenRecord: null };
}
