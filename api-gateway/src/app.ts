import Fastify from "fastify";
import * as dotenv from "dotenv";
import proxy from "@fastify/http-proxy";
import jwtPlugin from "./plugins/jwt.plugin";

dotenv.config();

const app = Fastify({ logger: true });
const port: number = +(process.env.PORT || "3000");

app.register(jwtPlugin);
app.register(proxy, {
  upstream: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  prefix: "/auth/",
  rewritePrefix: "/auth/",
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
  prefix: "/user/",
  rewritePrefix: "/user/",
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

const start = async () => {
  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Api-gateway ${port} portunda çalıştı`);
  } catch (error) {
    console.log({
      message: "Api gateway sunucusu çalıştırılırken sorun oluştu:",
      error,
    });
    app.log.error(error);
    process.exit(1);
  }
};

start();
