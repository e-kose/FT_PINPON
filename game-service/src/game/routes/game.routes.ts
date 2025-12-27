import type { FastifyInstance } from "fastify";
import { GameController } from "../controller/game.controller.js";

export async function gameRoutes(app: FastifyInstance) {
  const controller = new GameController(app.gameService, app.matchmakingService, app.inviteService);

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

  // ============================================================================
  // MATCHMAKING ENDPOINTS
  // ============================================================================

  // Join matchmaking queue
  app.post(
    "/matchmaking/join",
    {
      schema: {
        description: "Join matchmaking queue to find an opponent",
        tags: ["matchmaking"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        response: {
          200: {
            description: "Successfully joined matchmaking queue",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  position: { type: "number" },
                  estimatedWait: { type: "number" },
                },
              },
            },
          },
          400: {
            description: "Bad request",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.joinMatchmaking.bind(controller)
  );

  // Leave matchmaking queue
  app.post(
    "/matchmaking/leave",
    {
      schema: {
        description: "Leave matchmaking queue",
        tags: ["matchmaking"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        response: {
          200: {
            description: "Successfully left matchmaking queue",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.leaveMatchmaking.bind(controller)
  );

  // Get matchmaking status
  app.get(
    "/matchmaking/status",
    {
      schema: {
        description: "Get current matchmaking queue status",
        tags: ["matchmaking"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        response: {
          200: {
            description: "Matchmaking status",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  inQueue: { type: "boolean" },
                  position: { type: "number" },
                  queueLength: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    controller.getMatchmakingStatus.bind(controller)
  );

  // ============================================================================
  // INVITE ENDPOINTS (Chat → Game)
  // ============================================================================

  // Send game invite
  app.post(
    "/invite/send",
    {
      schema: {
        description: "Send a game invite to another player",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
            "x-user-nickname": { type: "string" },
          },
          required: ["x-user-id"],
        },
        body: {
          type: "object",
          required: ["toUserId"],
          properties: {
            toUserId: { type: "number" },
            toNickname: { type: "string" },
            maxScore: { type: "number", minimum: 5, maximum: 21, default: 11 },
          },
        },
        response: {
          201: {
            description: "Invite sent successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    controller.sendInvite.bind(controller)
  );

  // Accept game invite
  app.post(
    "/invite/:inviteId/accept",
    {
      schema: {
        description: "Accept a game invite and start the game",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        params: {
          type: "object",
          properties: {
            inviteId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Invite accepted and game created",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  invite: { type: "object" },
                  game: { type: "object" },
                  notification: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    controller.acceptInvite.bind(controller)
  );

  // Decline game invite
  app.post(
    "/invite/:inviteId/decline",
    {
      schema: {
        description: "Decline a game invite",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        params: {
          type: "object",
          properties: {
            inviteId: { type: "string" },
          },
        },
      },
    },
    controller.declineInvite.bind(controller)
  );

  // Cancel sent invite
  app.post(
    "/invite/:inviteId/cancel",
    {
      schema: {
        description: "Cancel a sent game invite",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        params: {
          type: "object",
          properties: {
            inviteId: { type: "string" },
          },
        },
      },
    },
    controller.cancelInvite.bind(controller)
  );

  // Get pending invites
  app.get(
    "/invite/pending",
    {
      schema: {
        description: "Get pending invites for current user",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        response: {
          200: {
            description: "List of pending invites",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
            },
          },
        },
      },
    },
    controller.getPendingInvites.bind(controller)
  );

  // Get sent invites
  app.get(
    "/invite/sent",
    {
      schema: {
        description: "Get invites sent by current user",
        tags: ["invite"],
        headers: {
          type: "object",
          properties: {
            "x-user-id": { type: "string" },
          },
          required: ["x-user-id"],
        },
        response: {
          200: {
            description: "List of sent invites",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
            },
          },
        },
      },
    },
    controller.getSentInvites.bind(controller)
  );
}
