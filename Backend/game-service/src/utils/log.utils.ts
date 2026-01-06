import type { FastifyInstance, FastifyRequest } from "fastify";

export function logError(app: FastifyInstance, req: FastifyRequest, error: any) {
  app.logger.error({
    service: process.env.SERVICE_NAME,
    method: req.method,
    url: req.url,
    msg: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  });
}

export function startLogError(app: FastifyInstance, error: any) {
  if (app?.log) {
    app.log.error({
      service: process.env.SERVICE_NAME,
      msg: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
  } else {
    console.error("[Fallback Log]", error);
  }
}

export function logInfo(app: FastifyInstance, req: FastifyRequest, message: string) {
  app.logger.info({
    service: process.env.SERVICE_NAME,
    method: req.method,
    url: req.url,
    msg: message,
    time: new Date().toISOString()
  });
}

export function logWarn(app: FastifyInstance, req: FastifyRequest, message: string) {
  app.logger.warn({
    service: process.env.SERVICE_NAME,
    method: req.method,
    url: req.url,
    msg: message,
    time: new Date().toISOString()
  });
}
