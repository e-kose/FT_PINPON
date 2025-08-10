import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "./types/register.userBody.js";
import {
  getMeService,
  googleAuthService,
  loginUserService,
  logoutService,
  refreshTokenService,
  registerService,
  twoFactorDisableService,
  twoFactorEnableService,
  twoFactorSetupService,
} from "./auth.service.js";
import {
  InvalidCredentials,
  InvalidToken,
  twoFacNotInit,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
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
    if (
      error instanceof UserAlreadyExistsEmail ||
      error instanceof UserAlreadyExistsUsername
    ) {
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
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
    return reply.code(200).send({ success: true, accesstoken, user });
  } catch (error) {
    req.log.error(error);
    if (
      error instanceof UserNotFound ||
      error instanceof InvalidCredentials ||
      error instanceof InvalidToken
    ) {
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    }
    return reply.internalServerError("An error has occurred");
  }
}

export async function refreshToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { accesstoken, refreshtoken } = await refreshTokenService(req);
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ success: true, accesstoken });
  } catch (error) {
    req.log.error(error);
    if (error instanceof InvalidToken) {
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
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

export async function me(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getMeService(req);
    reply.code(200).send({ success: result.success, user: result.user });
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserNotFound)
      reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    reply.internalServerError("An error has occurred");
  }
}

export async function googleAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await googleAuthService(req.server, req);
    reply.code(200).send(user);
  } catch (error) {
    reply.internalServerError("Google Auth error");
  }
}

export async function twoFactorSetup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await twoFactorSetupService(req);
    reply.code(200).send(result);
  } catch (error) {
    reply.internalServerError("An error has occurred");
  }
}

export async function twoFactorEnable(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await twoFactorEnableService(req);
    reply.code(200).send(result);
  } catch (error) {
    if (error instanceof InvalidToken || error instanceof twoFacNotInit)
      reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    reply.internalServerError("An error has occurred");
  }
}

export async function twoFactorDisable(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await twoFactorDisableService(req);
    reply.code(200).send(result);
  } catch (error) {
    reply.internalServerError("An error has occurred");
  }
}
