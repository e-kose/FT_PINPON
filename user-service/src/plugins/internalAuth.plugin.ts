import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { Forbidden, InvalidToken } from "../user/errors/user.errors.js";

export default fp(async function internalAuth(app: FastifyInstance) {
  app.addHook(
    "preHandler",
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (req.routeOptions.url?.startsWith("/internal")) {
        const secret = req.headers["x-internal-secret"];
        if (secret !== process.env.INTERNAL_API_KEY) {
          throw new Forbidden();
        }
      }
    }
  );
});
