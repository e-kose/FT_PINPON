import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { fastifyJwt } from "@fastify/jwt";
import * as dotenv from "dotenv";
import { payload } from "../auth/types/payload.js";
import { InvalidToken } from "../errors/auth.errors.js";

dotenv.config();

export default fp(async (app: FastifyInstance) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT secret not found");
  app.register(fastifyJwt, { secret });
  app.decorate(
    "jwtAuth",
    async function (req: FastifyRequest, reply: FastifyReply) {
      try {
        await req.jwtVerify();
      } catch (error) {
        reply.status(401).send({ error: "Unauthorized" });
      }
    }
  );
  app.decorate(
    "verifyRefreshToken",
    async function (req: FastifyRequest, reply: FastifyReply) {
      const token = req.cookies?.refresh_token;

      if (!token) {
        throw new InvalidToken();
      }

      try {
        const payload: payload = await app.jwt.verify(token);
        req.user = payload;
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
  );
});
