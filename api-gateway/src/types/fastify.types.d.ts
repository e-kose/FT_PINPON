import fastify from 'fastify'

declare module "fastify" {
  interface FastifyInstance {
    jwtAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}