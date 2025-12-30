import fp from "fastify-plugin";
import fastifySensible from "@fastify/sensible";
import type { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
  app.register(fastifySensible);
});
