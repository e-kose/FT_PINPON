import type { FastifyInstance, FastifyRequest } from "fastify";

export function logError(app:FastifyInstance, req: FastifyRequest, error: any) {
  app.logger.error({
    service: process.env.SERVICE_NAME,
    method: req.method,
    url: req.url,
    msg: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  });
}

export function startLogError(app:FastifyInstance, error: any) {
  app.logger.error({
    service: process.env.SERVICE_NAME,
    msg: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  });
}
