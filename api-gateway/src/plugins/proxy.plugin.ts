import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import proxy from "@fastify/http-proxy";

export default fp(async (app: FastifyInstance) => {
  app.register(proxy, {
    upstream: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    prefix: "/auth",
    rewritePrefix: "/auth",
    preHandler: async (req, reply) => {
      if (
        req.url.startsWith("/auth/2fa/setup") ||
        req.url.startsWith("/auth/2fa/enable") ||
        req.url.startsWith("/auth/2fa/disable") ||
        req.url.startsWith("/auth/me")
      ) {
        await app.jwtAuth(req, reply);
        if (req.user) {
          req.headers["x-user-id"] = (req.user as any).id;
          req.headers["x-user-email"] = (req.user as any).email;
        }
      }
    },
  });

  app.register(proxy, {
    upstream: process.env.USER_SERVICE_URL || "http://localhost:3002",
    prefix: "/user",
    rewritePrefix: "/user",
    preHandler: async (req, reply) => {
      if (req.url.startsWith("/user") && !req.url.startsWith("/user/docs")) {
        await app.jwtAuth(req, reply);
        if (req.user) {
          req.headers["x-user-id"] = (req.user as any).id;
          req.headers["x-user-email"] = (req.user as any).email;
        }
      }
    },
  });

  app.register(proxy, {
  upstream: process.env.USER_SERVICE_URL || "http://user-service:3002",
  prefix: "/friend",
  rewritePrefix: "/friend",
  preHandler: async (req, reply) => {
    await app.jwtAuth(req, reply);
    if (req.user) {
      req.headers["x-user-id"] = (req.user as any).id;
      req.headers["x-user-email"] = (req.user as any).email;
    }
  },
});

  app.register(proxy, {
  upstream: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3003",
  prefix: "/notification",
  rewritePrefix: "/notification",
  preHandler: async (req, reply) => {
    await app.jwtAuth(req, reply);
    if (req.user) {
      req.headers["x-user-id"] = (req.user as any).id;
      req.headers["x-user-email"] = (req.user as any).email;
    }
  },
});

  app.register(proxy, {
    upstream: process.env.CHAT_SERVICE_URL || "http://chat-service:3003",
    prefix: "/chat",
    rewritePrefix: "/chat",
    preHandler: async (req, reply) => {
      if (
        req.url.startsWith("/chat") &&
        !req.url.startsWith("/chat/docs") &&
        !req.url.startsWith("/chat/notify-tournament")
      ) {
        await app.jwtAuth(req, reply);
        if (req.user) {
          req.headers["x-user-id"] = (req.user as any).id;
          req.headers["x-user-email"] = (req.user as any).email;
        }
      }
    },
  });
});
