import fastifyPlugin from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("connect", () => {
    fastify.log.info("Redis connected successfully");
  });

  redis.on("error", (err) => {
    fastify.log.error({ err }, "Redis connection error");
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async (instance) => {
    await redis.quit();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}
