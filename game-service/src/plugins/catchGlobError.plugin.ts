import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error({
        error: {
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode,
        },
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      });

      const statusCode = error.statusCode || 500;
      const message = error.message || "Internal Server Error";

      reply.status(statusCode).send({
        statusCode,
        error: error.name || "Error",
        message,
        timestamp: new Date().toISOString(),
      });
    }
  );
});
