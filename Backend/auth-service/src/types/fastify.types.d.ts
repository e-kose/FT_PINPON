import "fastify"
import BetterSqlite from 'better-sqlite3'
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

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: any;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    vaultSecrets: Record<string, any>;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    db: BetterSqlite;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    logger: pino.Logger;
  }
}