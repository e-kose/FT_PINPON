import { IncomingMessage } from "http";
import fastify from 'fastify'

declare module "fastify" {
  interface FastifyInstance {
    jwtAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}


declare module "fastify" {
  interface FastifyInstance {
    wsJwtAuth(req: IncomingMessage) : any;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    logger: pino.Logger;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}