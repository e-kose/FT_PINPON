import "fastify"

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    jwtAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyRefreshToken(req: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

declare module 'fastify' {
  interface FastifyReply {
    setRefreshTokenCookie(token: string): FastifyReply;
    clearRefreshTokenCookie(): FastifyReply;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    globalErrorHandling: (error: any, reply: FastifyReply) => Promise<void>;
  }
}

