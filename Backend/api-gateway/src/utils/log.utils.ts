import type { FastifyInstance } from "fastify";


export function startLogError(app:FastifyInstance, error: any) {
  app.logger.error({
    service: process.env.SERVICE_NAME,
    msg: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  });
}
