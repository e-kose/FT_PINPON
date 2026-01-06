export const getUserProfileSchema = {
  params: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        pattern: "^[a-zA-Z0-9_-]+$",
        description: "User ID",
      },
    },
    required: ["userId"],
  },
  response: {
    200: {
      description: "User profile retrieved successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            userId: { type: "string" },
            username: { type: "string" },
            stats: {
              type: "object",
              properties: {
                matchmaking: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    wins: { type: "number" },
                    losses: { type: "number" },
                  },
                },
                tournaments: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    wins: { type: "number" },
                  },
                },
              },
            },
            recentMatches: { type: "array" },
            recentTournaments: { type: "array" },
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string" },
        message: { type: "string" },
      },
    },
  },
};

export const getTournamentSchema = {
  params: {
    type: "object",
    properties: {
      tournamentId: {
        type: "string",
        pattern: "^tour-[a-f0-9-]+$",
        description: "Tournament ID",
      },
    },
    required: ["tournamentId"],
  },
  response: {
    200: {
      description: "Tournament retrieved successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            id: { type: "string" },
            size: { type: "number" },
            winnerId: { type: "string" },
            winnerUsername: { type: "string" },
            participants: { type: "array" },
            finishedAt: { type: "string" },
            matches: { type: "array" },
          },
        },
      },
    },
    404: {
      description: "Tournament not found",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string" },
      },
    },
    500: {
      description: "Internal server error",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string" },
        message: { type: "string" },
      },
    },
  },
};
