import type { FastifyInstance } from "fastify";
import { TournamentController } from "../controller/tournament.controller.js";

export async function tournamentRoutes(app: FastifyInstance) {
  const controller = new TournamentController(app.tournamentService);

  // Create tournament
  app.post(
    "/create",
    {
      schema: {
        description: "Create a new tournament with 4 or 8 player aliases",
        tags: ["tournament"],
        body: {
          type: "object",
          required: ["aliases"],
          properties: {
            aliases: {
              type: "array",
              items: { type: "string", minLength: 2, maxLength: 20 },
              minItems: 4,
              maxItems: 8,
              description: "List of player aliases (4 or 8 players)",
            },
            name: { type: "string", minLength: 3, maxLength: 100 },
            maxScore: { type: "number", minimum: 5, maximum: 21, default: 11 },
          },
        },
        response: {
          201: {
            description: "Tournament created successfully",
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
    controller.createTournament.bind(controller)
  );

  // Get all tournaments
  app.get(
    "/",
    {
      schema: {
        description: "Get all tournaments with optional filters",
        tags: ["tournament"],
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["registration", "in_progress", "finished", "cancelled"],
            },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "number", minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            description: "List of tournaments",
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
    controller.getTournaments.bind(controller)
  );

  // Get tournament by ID
  app.get(
    "/:id",
    {
      schema: {
        description: "Get tournament details with bracket",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Tournament details",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    controller.getTournament.bind(controller)
  );

  // Get next match
  app.get(
    "/:id/next-match",
    {
      schema: {
        description: "Get the next match to be played in the tournament",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Next match details or null if finished",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", nullable: true },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.getNextMatch.bind(controller)
  );

  // Get bracket
  app.get(
    "/:id/bracket",
    {
      schema: {
        description: "Get the full tournament bracket",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Tournament bracket",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    controller.getBracket.bind(controller)
  );

  // Start a match
  app.post(
    "/:id/match/:matchId/start",
    {
      schema: {
        description: "Start a specific tournament match",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            matchId: { type: "string" },
          },
          required: ["id", "matchId"],
        },
        response: {
          200: {
            description: "Match started",
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
    controller.startMatch.bind(controller)
  );

  // Report match result
  app.post(
    "/:id/match/:matchId/result",
    {
      schema: {
        description: "Report the result of a match",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
            matchId: { type: "string" },
          },
          required: ["id", "matchId"],
        },
        body: {
          type: "object",
          required: ["winnerAlias", "player1Score", "player2Score"],
          properties: {
            winnerAlias: { type: "string" },
            player1Score: { type: "number", minimum: 0 },
            player2Score: { type: "number", minimum: 0 },
          },
        },
        response: {
          200: {
            description: "Match result recorded",
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
    controller.reportMatchResult.bind(controller)
  );

  // Cancel tournament
  app.post(
    "/:id/cancel",
    {
      schema: {
        description: "Cancel a tournament",
        tags: ["tournament"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Tournament cancelled",
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
    controller.cancelTournament.bind(controller)
  );
}
