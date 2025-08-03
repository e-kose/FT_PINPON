import "fastify"

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    jwtAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}