import type { FastifyInstance } from "fastify";
import { GameController } from "../controller/game.controller.js";

export async function gameRoutes(app: FastifyInstance) {
  const controller = new GameController(app.gameService);

  // Create local game
  app.post(
    "/local/create",
    {
      schema: {
        description: "Create a local game with guest players",
        tags: ["game"],
        body: {
          type: "object",
          required: ["player1_nickname", "player2_nickname"],
          properties: {
            player1_nickname: { type: "string", minLength: 2, maxLength: 20 },
            player2_nickname: { type: "string", minLength: 2, maxLength: 20 },
            max_score: { type: "number", minimum: 5, maximum: 21, default: 11 },
          },
        },
        response: {
          201: {
            description: "Game created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.createLocalGame.bind(controller)
  );

  // Get all games
  app.get(
    "/",
    {
      schema: {
        description: "Get all games with optional filters",
        tags: ["game"],
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["waiting", "ready", "playing", "finished", "cancelled"]
            },
            game_mode: {
              type: "string",
              enum: ["local", "online", "tournament"]
            },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
      },
    },
    controller.getGames.bind(controller)
  );

  // Get active games
  app.get(
    "/active",
    {
      schema: {
        description: "Get all active games",
        tags: ["game"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
              total_active: { type: "number" },
            },
          },
        },
      },
    },
    controller.getActiveGames.bind(controller)
  );

  // Get game by ID
  app.get(
    "/:id",
    {
      schema: {
        description: "Get game details by ID",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    controller.getGame.bind(controller)
  );

  // Get player's game history
  app.get(
    "/history/:userId",
    {
      schema: {
        description: "Get player's game history",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
      },
    },
    controller.getPlayerGames.bind(controller)
  );

  // Start game
  app.post(
    "/:id/start",
    {
      schema: {
        description: "Start a game",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    controller.startGame.bind(controller)
  );

  // Update score
  app.patch(
    "/:id/score",
    {
      schema: {
        description: "Update game score",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["player1_score", "player2_score"],
          properties: {
            player1_score: { type: "number", minimum: 0 },
            player2_score: { type: "number", minimum: 0 },
          },
        },
      },
    },
    controller.updateScore.bind(controller)
  );

  // Finish game
  app.post(
    "/:id/finish",
    {
      schema: {
        description: "Finish a game and determine winner",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    controller.finishGame.bind(controller)
  );

  // Cancel game
  app.post(
    "/:id/cancel",
    {
      schema: {
        description: "Cancel a game",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    controller.cancelGame.bind(controller)
  );

  // Delete game
  app.delete(
    "/:id",
    {
      schema: {
        description: "Delete a game",
        tags: ["game"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          204: {
            description: "Game deleted successfully",
            type: "null",
          },
        },
      },
    },
    controller.deleteGame.bind(controller)
  );
}
