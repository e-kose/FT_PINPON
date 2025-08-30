import axios from "axios";
import type { FastifyInstance } from "fastify";

const userService = process.env.USER_SERVICE || "http://localhost:3002";
export class UserCache {
  app: FastifyInstance;
  ttl: number = 60 * 15;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  async getUser(userId: number) {
    const cached = await this.app.redis.get(`user:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    const res = (await axios(userService + `/user/id/${userId}`)).data;
    await this.app.redis.set(
      `user:${userId}`,
      JSON.stringify(res),
      "EX",
      this.ttl
    );
    return res;
  }
}
