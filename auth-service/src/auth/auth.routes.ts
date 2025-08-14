import { FastifyInstance } from "fastify";
import {
  googleAuth,
  login,
  logout,
  me,
  refreshToken,
  register,
  twoFactorDisable,
  twoFactorEnable,
  twoFactorSetup,
} from "./auth.controller.js";
import { registerUserSchema } from "./schemas/register.userSchema.js";
import { loginUserSchema } from "./schemas/login.userSchema.js";
import { refreshSchema } from "./schemas/refresh.tokenSchema.js";
import { logoutSchema } from "./schemas/logoutSchema.js";
import { getMeSchema } from "./schemas/getMe.schema.js";
import { OAuthSchema } from "./schemas/OAuth.schema.js";
import {
  twoFacDisableSchema,
  twoFacEnableSchema,
  twoFacSetupSchema,
} from "./schemas/2FA.schema.js";

const createSchema = (summary: string, schema: any) => ({
  tags: ["Auth"],
  summary,
  ...schema,
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    {
      schema: createSchema("Yeni kullanıcı kaydı", registerUserSchema),
    },
    register
  );

  app.post(
    "/login",
    {
      schema: createSchema("Kullanıcı girişi", loginUserSchema),
    },
    login
  );

  app.post(
    "/refresh-token",
    {
      preHandler: [app.verifyRefreshToken],
      schema: createSchema("Yeni access token al", refreshSchema),
    },
    refreshToken
  );

  app.post(
    "/logout",
    {
      preHandler: [app.verifyRefreshToken],
      schema: createSchema("Kullanıcı çıkışı", logoutSchema),
    },
    logout
  );
  app.post(
    "/2fa/setup",
    {
      preHandler: [app.jwtAuth],
      schema: createSchema("2FA secret oluştur", twoFacSetupSchema),
    },
    twoFactorSetup
  );
  app.post(
    "/2fa/enable",
    {
      preHandler: [app.jwtAuth],
      schema: createSchema("Kullancı 2FA Aktif Etme", twoFacEnableSchema),
    },
    twoFactorEnable
  );
  app.post(
    "/2fa/disable",
    {
      preHandler: [app.jwtAuth],
      schema: createSchema("Kullancı 2FA Pasif Etme", twoFacDisableSchema),
    },
    twoFactorDisable
  );
  
  app.get(
    "/me",
    {
      preHandler: [app.jwtAuth],
      schema: createSchema("Kullanıcı profili getirme", getMeSchema),
    },
    me
  );

  app.get(
    "/google/callback",
    createSchema("Login user", OAuthSchema),
    googleAuth
  );
}
