import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "./types/register.userBody.js";
import {
  loginUserService,
  refreshTokenService,
  registerService,
} from "./auth.service.js";
import {
  InvalidCredentials,
  UserAlreadyExists,
  UserNotFound,
} from "../errors/auth.errors.js";
import { loginUserBody } from "./types/login.userBody.js";
import { refreshToken } from "./types/refreh.token.js";
import * as dotenv from 'dotenv';

dotenv.config();

export async function register(
  req: FastifyRequest<{ Body: registerUserBody }>,
  reply: FastifyReply
) {
  try {
    const result = await registerService(req.body);
    return reply.code(201).send(result);
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserAlreadyExists) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    return reply.internalServerError("Bir hata oluştu");
  }
}

export async function login(
  req: FastifyRequest<{ Body: loginUserBody }>,
  reply: FastifyReply
) {
  try {
    const { email, username, password } = req.body;
    if (!email && !username)
      return reply
        .code(400)
        .send({
          success: false,
          message: "E-posta veya kullanıcı adı gerekli",
        });
    if (!password)
      return reply.code(400).send({ success: false, message: "Şifre gerekli" });
    const { user, accesstoken,refreshtoken } = await loginUserService(req.server, req.body);
    const maxAge = parseDuration(process.env.REFRESH_EXPIRES_IN || '7d');
    reply.setCookie("refresh_token", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge
    });
    return reply.code(200).send({ user, accesstoken });
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserNotFound || error instanceof InvalidCredentials) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    return reply.internalServerError("Bir hata oluştu");
  }
}

export async function refreshToken(
  req: FastifyRequest<{ Body: refreshToken }>,
  reply: FastifyReply
) {
  const { refreshtoken } = req.body;
  if (!refreshtoken)
    return reply
      .code(400)
      .send({ success: false, message: "Refresh token gerekli" });
  try {
    await refreshTokenService(req.server, refreshtoken);
  } catch (error) {}
}
