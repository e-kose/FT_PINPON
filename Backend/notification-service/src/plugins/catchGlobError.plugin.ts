import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyError } from "fastify";
import { logError } from "../utils/log.utils.js";

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler(function (error: FastifyError, request: any, reply: FastifyReply) {
    if ((error as any).validation) {
      logError(app, request, error);
      return reply.status(400).send({
        success: false,
        error: "Bad Request",
        message: error.message || "Invalid data",
        errors: (error as any).validation,
      });
    }

    if (error.code === 'FORBIDDEN') {
      return reply.status(403).send({
        success: false,
        message: error.message || "Invalid data",
      });
    }

    return reply.status(500).send({
      success: false,
      error: "Internal Server Error",
      message: error.message || "Server Error",
    });
  });
});
