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
  AuthDataNotFound,
  InvalidCredentials,
  InvalidToken,
  InvalidTwoFacToken,
  RequiredToken,
  twoFacNotInit,
} from "./errors/auth.errors.js";
import { payload } from "./types/payload.js";
import * as dotenv from "dotenv";
import axios from "axios";
import { checkUserExist, userServicePost } from "./utils/axios.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const userService = process.env.USER_SERVICE || "http://localhost:3002";
const headers = {
  headers: {
    "X-Internal-Secret": process.env.INTERNAL_API_KEY,
  },
};

export async function registeUserService(userId: number, req: FastifyRequest) {
  const db = req.server.db;
  const result = db
    .prepare("INSERT INTO auth_table (user_id) VALUES(?)")
    .run(userId);
  return result;
}

export async function loginUserService(response: any, req: FastifyRequest) {
  const body = req.body as loginUserBody;
  const db = req.server.db;
  const authValues = getAuthTable(db, response.data.id);

  if (authValues && authValues.twofa_enable) {
    if (!body.token) throw new InvalidToken();
    const speakeasy = (await import("speakeasy")).default;
    const verified = speakeasy.totp.verify({
      secret: authValues.twofa_secret,
      encoding: "base32",
      token: body.token,
      window: 1,
    });
    if (!verified) throw new InvalidTwoFacToken();
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
  const userId = req.headers["x-user-id"];
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
  const emailIsExist = await checkUserExist(
    userService + `/user/email/${googleUser.email}`
  );
  if (emailIsExist.user) {
    return OAuthLoginService(app, emailIsExist.user!);
  } else {
    let userName = googleUser.email.split("@")[0];
    while (true) {
      let isExist = await checkUserExist(
        userService + `/user/username/${userName}`
      );
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
  let oauth_id = "";
  const authValues = getAuthTable(app.db, user.id);
  if (authValues && authValues.oauth_id) {
    oauth_id = authValues.oauth_id;
  }
  const payload = {
    id: user.id,
    oauth_id,
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
  const baseUrl = process.env.API_GATEWAY_URL || "http://localhost:3000";
  let avatarUrl =
    baseUrl + "/auth/static/default-profile.png";

  if (user.picture) {
    try {
      const avatarResponse = await fetch(user.picture);
      if (avatarResponse.ok) {
        const buffer = await avatarResponse.arrayBuffer();
        const fileName = `google-${user.id}-${Date.now()}.jpg`;

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const avatarsDir = path.join(__dirname, "../../public");
        const filePath = path.join(avatarsDir, fileName);

        await fs.mkdir(avatarsDir, { recursive: true });
        await fs.writeFile(filePath, Buffer.from(buffer));

        avatarUrl = `${baseUrl}/auth/static/${fileName}`;
      }
    } catch (error) {
      console.error("Failed to download Google avatar:", error);
    }
  }

  const result = await userServicePost(userService + `/internal/user`, {
    username: userName,
    email: user.email,
    password: null,
    profile: {
      avatar_url: avatarUrl,
    },
  });
  app.db
    .prepare("INSERT INTO auth_table (user_id, oauth_id) VALUES(?,?)")
    .run(result.userId, user.id);
  const fUser = await axios.get(userService + `/user/id/${result.userId}`);
  return await OAuthLoginService(app, fUser.data.user);
}

export async function twoFactorSetupService(req: FastifyRequest) {
  const id = req.headers["x-user-id"];
  const email = req.headers["x-user-email"];
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
  const id = req.headers["x-user-id"];
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

  await axios.patch(
    userService + "/user",
    { is_2fa_enabled: true },
    { headers: { "x-user-id": id } }
  );
  db.prepare("UPDATE auth_table SET twofa_enable = 1 WHERE user_id = ?").run(
    id
  );
  try {
    await axios.patch(
      userService + "/user",
      {
        is_2fa_enabled: true,
      },
      {
        headers: {
          "x-user-id": id,
        },
      }
    );
  } catch (err) {
    console.error("Failed to update 2FA status in user service:", err);
  }
  return { success: true, message: "2FA enabled" };
}

export async function twoFactorDisableService(req: FastifyRequest) {
  const db = req.server.db;
  const id = req.headers["x-user-id"];
  console.log(id);
  await axios.patch(
    userService + "/user",
    { is_2fa_enabled: false },
    { headers: { "x-user-id": id } }
  );
  db.prepare(
    "UPDATE auth_table SET twofa_enable = 0, twofa_secret = NULL WHERE user_id = ?"
  ).run(id);
  try {
    await axios.patch(
      userService + "/user",
      {
        is_2fa_enabled: false,
      },
      {
        headers: {
          "x-user-id": id,
        },
      }
    );
  } catch (err) {
    console.error("Failed to update 2FA status in user service:", err);
  }
  return { success: true, message: "2FA disabled" };
}

export function findRefreshTokensUserId(db: Database, id: number) {
  const tokenRecord = db
    .prepare("SELECT * FROM refresh_tokens WHERE user_id=?")
    .get(id) as refreshTokenDB;
  if (tokenRecord) return { success: true, tokenRecord };
  return { success: false, tokenRecord: null };
}

export async function deleteAuthDataService(req: FastifyRequest) {
  const db = req.server.db;
  const userId = Number(req.headers["x-user-id"]);
  
  const result = db.transaction((userId: number) => {
    db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(userId);
    return db.prepare("DELETE FROM auth_table WHERE user_id = ?").run(userId);
  })(userId);
  
  if (result.changes > 0) {
    return { success: true, message: "Auth data deleted" };
  } else {
    throw new AuthDataNotFound();
  }
}
