import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "../types/table.types/register.userBody.js";
import {
  InvalidCredentials,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
  UserNotFound,
} from "../errors/user.errors.js";

export async function createUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userService = req.server.userService;
    const result = await userService!.createUser(req.body as registerUserBody);
    reply.code(201).send(result);
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
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userService = req.server.userService;
    const result = await userService!.loginUserService(req.body);
    reply.code(200).send(result);
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserNotFound || error instanceof InvalidCredentials){

      reply
      .code(error.statusCode)
      .send({ success: false, message: error.message });
    }
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}
