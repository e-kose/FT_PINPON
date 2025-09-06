import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  getMeService,
  googleAuthService,
  loginUserService,
  logoutService,
  refreshTokenService,
  twoFactorSetupService,
  twoFactorEnableService,
  twoFactorDisableService,
} from "./auth.service.js";
import { refreshToken } from "./types/refresh.token.js";
import * as dotenv from "dotenv";
import axios from "axios";
import { loginUserBody } from "./types/login.userBody.js";
import {
  Forbidden,
  InvalidCredentials,
  InvalidToken,
  twoFacNotInit,
} from "./errors/auth.errors.js";
import { registerUserBody } from "./types/register.userBody.js";
import { logError } from "./utils/log.utils.js";

dotenv.config();
const DEFAULT_AVATAR = process.env.R2_PUBLIC_URL + "/default-profile.png";
const userService = process.env.USER_SERVICE || "http://localhost:3002";
const headers = {
  headers: {
    "X-Internal-Secret": process.env.INTERNAL_API_KEY,
  },
};

export async function register(req: FastifyRequest<{Body : registerUserBody}>, reply: FastifyReply) {
  try {
    if (!req.body.profile) req.body.profile = { avatar_url: DEFAULT_AVATAR };
    else req.body.profile.avatar_url = DEFAULT_AVATAR;
    const result = await axios.post(
      userService + "/internal/user",
      req.body,
      headers
    );
    return reply.code(result.status).send(result.data);
  } catch (error: any) {
    logError(req.server, req, error);
    if (error.response) {
      return reply.code(error.response.status).send(error.response.data);
    }
    return reply
      .code(500)
      .send({ success: false, message: "User service error" });
  }
}

export async function login(
  req: FastifyRequest<{ Body: loginUserBody }>,
  reply: FastifyReply
) {
  try {
    const response = await axios.post(
      userService + "/internal/login",
      req.body,
      headers
    );
    const { user, accesstoken, refreshtoken } = await loginUserService(
      response,
      req
    );
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ success: true, accesstoken, user });
  } catch (error: any) {
    logError(req.server, req, error);
    if (
      error instanceof InvalidToken ||
      error instanceof InvalidCredentials ||
      error instanceof Forbidden
    )
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    else if (error.response) {
      return reply.code(error.response.status).send(error.response.data);
    }
    return reply
      .code(500)
      .send({ success: false, message: "User service error" });
  }
}

export async function refreshToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { accesstoken, refreshtoken } = await refreshTokenService(req);
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ success: true, accesstoken });
  } catch (error) {
    logError(req.server, req, error);
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
      return reply.send({ success: true, message: "The exit has been made." });
    }
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof InvalidToken)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply.internalServerError("An error has occurred");
  }
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getMeService(req);
    return reply.code(200).send({ success: result.success, user: result.user });
  } catch (error: any) {
    logError(req.server, req, error);
    if (error.response) {
      return reply.code(error.response.status).send(error.response.data);
    }
    return reply
      .code(500)
      .send({ success: false, message: "User service error" });
  }
}

export async function googleAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { user, accesstoken, refreshtoken } = await googleAuthService(
      req.server,
      req
    );
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ success: true, accesstoken, user });
  } catch (error) {
    logError(req.server, req, error);
    return reply.internalServerError("Google Auth error");
  }
}

export async function twoFactorSetup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await twoFactorSetupService(req);
    return reply.code(200).send(result);
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof InvalidToken || error instanceof twoFactorSetup) {
      return reply.code((error as any).statusCode).send({
        success: false,
        message: (error as any).message,
      });
    }
    return reply.internalServerError("An error has occurred");
  }
}

export async function twoFactorEnable(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await twoFactorEnableService(req);
    return reply.code(200).send(result);
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof InvalidToken || error instanceof twoFacNotInit)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply.internalServerError("An error has occurred");
  }
}

export async function twoFactorDisable(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await twoFactorDisableService(req);
    return reply.code(200).send(result);
  } catch (error) {
    logError(req.server, req, error);
    return reply.internalServerError("An error has occurred");
  }
}
