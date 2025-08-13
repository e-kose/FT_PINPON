import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "../types/table.types/register.userBody";
import {
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
} from "../errors/user.errors";

export async function createUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userService = req.server.userService;
    const result = userService!.createUser(req.body as registerUserBody);
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
