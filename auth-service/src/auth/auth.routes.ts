import { FastifyInstance } from "fastify";
import { login, logout, me, refreshToken, register } from "./auth.controller.js";
import { registerUserSchema } from "./schemas/register.userSchema.js";
import { loginUserSchema } from "./schemas/login.userSchema.js";
import { refreshSchema } from "./schemas/refresh.tokenSchema.js";
import { logoutSchema } from "./schemas/logoutSchema.js";
import { getMeSchema } from "./schemas/getMe.schema.js";

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

  app.get(
    "/me",
    {
      preHandler: [app.jwtAuth],
      schema: createSchema("Kullanıcı profili getirme", getMeSchema),
    },
    me
  );
}
