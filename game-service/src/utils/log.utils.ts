import type { FastifyInstance } from "fastify";

export function startLogError(app: FastifyInstance, error: Error) {
  app.log.error({
    message: "Fatal error occurred",
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    timestamp: new Date().toISOString(),
  });
}
