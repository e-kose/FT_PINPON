import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "./types/register.UserBody.js";
import { registerService } from "./auth.service.js";
import { UserAlreadyExists } from "../errors/auth.errors.js";

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
