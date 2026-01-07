import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async function logger(app: FastifyInstance) {
  const serviceName = process.env.SERVICE_NAME || "game-service";
  const logLevel = process.env.LOG_LEVEL || "info";

  app.addHook("onRequest", async (req) => {
    app.log.info({
      service: serviceName,
      method: req.method,
      url: req.url,
      msg: "Incoming request",
      time: new Date().toISOString(),
    });
  });
});
