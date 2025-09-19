import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { fastifyJwt } from "@fastify/jwt";
import * as dotenv from "dotenv";
import { startLogError } from "../utils/log.utils.js";
import http from "http";

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
      } catch (error: any) {
        startLogError(app, error);
        return reply
          .status(401)
          .send({ success: false, error: "Unauthorized" });
      }
    }
  );

  app.decorate("wsJwtAuth", async function (req: http.IncomingMessage) {
    const authHeader = req.headers["authorization"];
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
    if(!token)
      throw new Error("Token nout found")
    return app.jwt.verify(token);
  });
});
