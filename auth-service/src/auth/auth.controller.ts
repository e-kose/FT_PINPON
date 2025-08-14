import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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
import { InvalidCredentials, InvalidToken, twoFacNotInit } from "./errors/auth.errors.js";

dotenv.config();
const userService = process.env.USER_SERVICE || "http://localhost:3002";

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await axios.post(userService + '/user', req.body);
    return reply.code(result.status).send(result.data);
  } catch (error: any) {
    req.log.error(error);
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
    const response = await axios.post(userService + '/login', req.body);
    const { user, accesstoken, refreshtoken } = await loginUserService(
      response, req
    );
    reply.setRefreshTokenCookie(refreshtoken);
    return reply.code(200).send({ success: true, accesstoken, user });
  } catch (error: any) {
     req.log.error(error);
    if (error.response) {
      return reply.code(error.response.status).send(error.response.data);
    }
    if(error instanceof InvalidToken || error instanceof InvalidCredentials)
      return reply.code(error.statusCode).send({success:false , message:error.message});
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
      return reply.send({ success: true, message: "The exit has been made." });
    }
  } catch (error) {
    if(error instanceof InvalidToken)
      return reply.code(error.statusCode).send({success : false, message : error.message});
    return reply.internalServerError("An error has occurred");
  }
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getMeService(req);
    console.log(result);
    return reply.code(200).send({ success: result.success, user: result.user });
  } catch (error : any) {
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
    const { user, accesstoken, refreshtoken } = await googleAuthService(req.server, req);
    reply.setRefreshTokenCookie(refreshtoken)
    return reply.code(200).send({ success: true, accesstoken, user });
  } catch (error) {
    return reply.internalServerError("Google Auth error");
  }
}

export async function twoFactorSetup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await twoFactorSetupService(req);
    return reply.code(200).send(result);
  }catch (error) {
  if (
    error instanceof InvalidToken ||
    error instanceof twoFactorSetup
  ) {
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
    return reply.internalServerError("An error has occurred");
  }
}
