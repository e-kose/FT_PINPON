import { checkHash, hashTransaction } from "./utils/hash.utils.js";
import type { Database } from "better-sqlite3";
import { loginUserBody } from "./types/login.userBody.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { genarateTokens } from "./utils/tokens.utils.js";
import { refreshTokenDB } from "./types/refreshTokenDB.js";
import { generateRandom4Digit } from "./utils/parseDuration.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { auth_tableDb } from "./types/authDb.js";
import {
  InvalidCredentials,
  InvalidToken,
  twoFacNotInit,
} from "./errors/auth.errors.js";
import { payload } from "./types/payload.js";
import * as dotenv from "dotenv";
import axios from "axios";
import { checkUserExist, userServicePost } from "./utils/axios.js";

dotenv.config();
const userService = process.env.USER_SERVICE || "http://localhost:3002";
const headers = {
  headers: {
    "X-Internal-Secret": process.env.INTERNAL_API_KEY,
  },
};


export async function loginUserService(response: any, req: FastifyRequest) {
  const body = req.body as loginUserBody;
  const db = req.server.db;
  const authValues = getAuthTable(db, response.data.id);

  if (authValues && authValues.twofa_enable) {
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
  const { accesstoken, refreshtoken } = await genarateTokens(
    req.server,
    payload
  );
  const { password, twofa_secret, ...userWithoutPassword } = response.data;
  await updateRefreshToken(db, payload.id, refreshtoken);
  return { user: userWithoutPassword, accesstoken, refreshtoken };
}

export function getAuthTable(db: Database, id: number) {
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

export async function logoutService(req: FastifyRequest) {
  const userId = (req.user as payload).id;
  const result = await updateRefreshToken(req.server.db, userId, "");
  return result;
}

export async function getMeService(req: FastifyRequest) {
  const userId = req.headers['x-user-id'];
  const user = await checkUserExist(userService + `/user/id/${userId}`);
  return user;
}

export async function googleAuthService(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const token = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
    req
  );
  const googleUser = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token.token.access_token}`,
      },
    }
  ).then((res) => res.json());
  const emailIsExist = await checkUserExist(userService + `/user/email/${googleUser.email}`);
  if (emailIsExist.user){
    return OAuthLoginService(app, emailIsExist.user!);
  }
  else {
    let userName = googleUser.email.split("@")[0];
    while (true) {
      let isExist = await checkUserExist(userService + `/user/username/${userName}`);
      if (!isExist.data.succes) break;
      else userName = userName + generateRandom4Digit();
    }
    return await OAuthRegister(app, userName, googleUser);
  }
}

export async function updateRefreshToken(
  db: Database,
  id: number,
  refreshToken: string
) {
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

export async function OAuthLoginService(app: FastifyInstance, user: any) {
  const payload: payload = {
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const { accesstoken, refreshtoken } = await genarateTokens(app, payload);
  await updateRefreshToken(app.db, payload.id, refreshtoken);
  const { password, ...safeUser } = user;
  return { user: safeUser, accesstoken, refreshtoken };
}

export async function OAuthRegister(
  app: FastifyInstance,
  userName: string,
  user: any
) {
  const result = await userServicePost(userService + `/internal/user`, {
    username: userName,
    email: user.email,
    password: null,
    profile : {
      avatar_url: user.picture
    }
  });
  app.db
    .prepare("INSERT INTO auth_table (user_id, oauth_id) VALUES(?,?)")
    .run(result.userId, user.id);
  const fUser = await axios.get(userService + `/user/id/${result.userId}`);
  return await OAuthLoginService(app, fUser.data.user);
}

export async function twoFactorSetupService(req: FastifyRequest) {
  const id = req.headers['x-user-id'];
  const email =  req.headers['x-user-email'];
  const db = req.server.db;
  const secret = speakeasy.generateSecret({
    name: `FtTranscendence:${email}`,
    issuer: "FtTranscendence",
    length: 32,
  });
  const userIsExist = db
    .prepare("SELECT * FROM auth_table WHERE user_id = ?")
    .get(id);
  if (!userIsExist) {
    db.prepare(
      "INSERT INTO auth_table(user_id, twofa_secret) VALUES(?, ?)"
    ).run(id, secret.base32);
  } else {
    db.prepare("UPDATE auth_table SET twofa_secret = ? WHERE user_id = ?").run(
      secret.base32,
      id
    );
  }
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url || "");
  return { success: true, qr: qrDataUrl };
}

export async function twoFactorEnableService(req: FastifyRequest) {
  const id = req.headers['x-user-id'];
  const db = req.server.db;
  const { token } = req.body as { token: string };
  const row = db
    .prepare("SELECT twofa_secret FROM auth_table WHERE user_id = ?")
    .get(id);
  if (!row?.twofa_secret) throw new twoFacNotInit();
  const verified = speakeasy.totp.verify({
    secret: row.twofa_secret,
    encoding: "base32",
    token,
    window: 1,
  });
  if (!verified) throw new InvalidToken();

  //->>>>>>>>>>>>>>>>>>MESAJ BROKER EKLE>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  db.prepare("UPDATE auth_table SET twofa_enable = 1 WHERE user_id = ?").run(
    id
  );
  return { success: true, message: "2FA enabled" };
}

export async function twoFactorDisableService(req: FastifyRequest) {
  const db = req.server.db;
  const id = req.headers['x-user-id'];
  db.prepare(
    "UPDATE auth_table SET twofa_enable = 0, twofa_secret = NULL WHERE user_id = ?"
  ).run(id);
  return { success: true, message: "2FA disabled" };
}

export function findRefreshTokensUserId(db: Database, id: number) {
  const tokenRecord = db
    .prepare("SELECT * FROM refresh_tokens WHERE user_id=?")
    .get(id) as refreshTokenDB;
  if (tokenRecord) return { success: true, tokenRecord };
  return { success: false, tokenRecord: null };
}
