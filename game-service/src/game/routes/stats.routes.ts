import type { FastifyInstance } from "fastify";
import { StatsController } from "../controller/stats.controller.js";

export async function statsRoutes(app: FastifyInstance) {
  const controller = new StatsController(app.statsService);

  // Get leaderboard
  app.get(
    "/leaderboard",
    {
      schema: {
        description: "Get player leaderboard",
        tags: ["stats"],
        querystring: {
          type: "object",
          properties: {
            sort_by: {
              type: "string",
              enum: ["rank_points", "wins", "win_streak"],
              default: "rank_points"
            },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
              sort_by: { type: "string" },
            },
          },
        },
      },
    },
    controller.getLeaderboard.bind(controller)
  );

  // Get user statistics
  app.get(
    "/stats/:userId",
    {
      schema: {
        description: "Get user statistics",
        tags: ["stats"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.getUserStats.bind(controller)
  );

  // Get user ranking position
  app.get(
    "/stats/:userId/ranking",
    {
      schema: {
        description: "Get user's ranking position",
        tags: ["stats"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user_id: { type: "number" },
                  position: { type: "number" },
                  rank_points: { type: "number" },
                  rank_tier: { type: "string" },
                  rank_tier_name: { type: "string" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.getUserRanking.bind(controller)
  );
}
