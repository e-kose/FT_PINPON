import Fastify from "fastify";
import * as dotenv from "dotenv";
import proxy from "@fastify/http-proxy";
import jwtPlugin from "./plugins/jwt.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import fastifyCors from "@fastify/cors";

dotenv.config();

const app = Fastify({ logger: true });
const port: number = +(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";

app.register(jwtPlugin);
app.register(loggerPlugin);
app.register(fastifyCors, {
  origin: true,
  credentials: true
});
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
  upstream : process.env.CHAT_SERVICE_URL || "http://localhost:3003",
  prefix : "/chat",
  rewritePrefix : "/chat",
  preHandler : async (req, reply) => {
    if (req.url.startsWith("/chat") && !req.url.startsWith("/chat/docs")){
      await app.jwtAuth(req, reply);
      if(req.user){
        req.headers["x-user-id"] = (req.user as any).id;
        req.headers["x-user-email"] = (req.user as any).email;
      }
    }
  }
})

const start = async () => {
  try {
    await app.listen({ port, host});
    app.logger.info(`The api gateway has been started on port ${host}:${port}.`);
  } catch (error: any) {
    console.log({
      message: "An issue occurred while running the API gateway server:",
      error,
    });
    startLogError(app, error);
    process.exit(1);
  }
};

start();
