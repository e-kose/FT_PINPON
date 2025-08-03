import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "./types/register.UserBody";
import { registerService } from "./auth.service";
import { UserAlreadyExists } from "../errors/auth.errors";

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = req.body as registerUserBody;
    const result = await registerService(body);
    return reply.code(201).send(result);
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserAlreadyExists) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    return reply.internalServerError("Bir hata oluştu");
  }
}
