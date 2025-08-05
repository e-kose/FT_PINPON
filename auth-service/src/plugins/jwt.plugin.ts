import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { fastifyJwt } from "@fastify/jwt";
import * as dotenv from "dotenv";
import { payload } from "../auth/types/payload";

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
        reply.status(401).send({ error: "Yetkisiz erişim" });
      }
    }
  );
  app.decorate(
    "verifyRefreshToken",
    async function (req: FastifyRequest, reply: FastifyReply) {
      const token = req.cookies?.refresh_token;

      if (!token) {
        return reply.status(401).send({ error: "Refresh token bulunamadı" });
      }

      try {
        const payload: payload = await app.jwt.verify(token);
        req.user = payload;
      } catch (err) {
        return reply.status(401).send({ error: "Geçersiz refresh token" });
      }
    }
  );
});
