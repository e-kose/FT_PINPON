import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "./types/register.userBody.js";
import {
  loginUserService,
  logoutService,
  refreshTokenService,
  registerService,
} from "./auth.service.js";
import {
  InvalidCredentials,
  InvalidToken,
  UserAlreadyExists,
  UserNotFound,
} from "../errors/auth.errors.js";
import { loginUserBody } from "./types/login.userBody.js";
import { refreshToken } from "./types/refresh.token.js";
import * as dotenv from "dotenv";

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
      return reply.code(error.statusCode).send({succues:false, error: error.message });
    }
    return reply.internalServerError("An error has occurred");
  }
}

export async function login(
  req: FastifyRequest<{ Body: loginUserBody }>,
  reply: FastifyReply
) {
  try {
    const { user, accesstoken, refreshtoken } = await loginUserService(
      req.server,
      req.body
    );
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ user, accesstoken });
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserNotFound || error instanceof InvalidCredentials) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    return reply.internalServerError("An error has occurred");
  }
}

export async function refreshToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { accesstoken, refreshtoken } = await refreshTokenService(req);
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ accesstoken });
  } catch (error) {
    req.log.error(error);
    if (error instanceof InvalidToken) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    return reply.internalServerError("An error has occurred");
  }
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    const res = await logoutService(req);
    if (res.success) {
      reply.clearCookie("refresh_token", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
    reply.send({ success: true, message: "The exit has been made." });
    }
  } catch (error) {
    return reply.internalServerError("An error has occurred");
  }
}
