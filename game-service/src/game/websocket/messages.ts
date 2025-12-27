import { z } from "zod";

// ============================================================================
// CLIENT -> SERVER MESSAGE SCHEMAS
// ============================================================================

// Client join local game (2 players, same PC)
export const JoinLocalGameSchema = z.object({
  type: z.literal("join_local_game"),
  data: z.object({
    gameId: z.string(),
    player1Nickname: z.string().min(1).max(50),
    player2Nickname: z.string().min(1).max(50),
  }),
});

// Client join online game (JWT auth)
export const JoinOnlineGameSchema = z.object({
  type: z.literal("join_online_game"),
  data: z.object({
    gameId: z.string(),
    token: z.string().optional(), // JWT token (optional if already authenticated)
  }),
});

// Paddle movement (W/S for player 1, Up/Down for player 2)
export const PaddleMoveSchema = z.object({
  type: z.literal("paddle_move"),
  data: z.object({
    direction: z.enum(["up", "down", "stop"]),
    playerId: z.string(), // "player1" or "player2" or userId
  }),
});

// Start game signal
export const StartGameSchema = z.object({
  type: z.literal("start_game"),
  data: z.object({
    gameId: z.string(),
  }),
});

// Pause/resume game
export const PauseGameSchema = z.object({
  type: z.literal("pause_game"),
  data: z.object({
    gameId: z.string(),
    paused: z.boolean(),
  }),
});

// Leave game
export const LeaveGameSchema = z.object({
  type: z.literal("leave_game"),
  data: z.object({
    gameId: z.string(),
  }),
});

// ============================================================================
// SERVER -> CLIENT MESSAGE SCHEMAS
// ============================================================================

// Game state broadcast (60 FPS)
export const GameStateSchema = z.object({
  type: z.literal("game_state"),
  data: z.object({
    gameId: z.string(),
    ball: z.object({
      x: z.number(),
      y: z.number(),
      vx: z.number(),
      vy: z.number(),
      radius: z.number(),
    }),
    paddle1: z.object({
      y: z.number(),
      height: z.number(),
      width: z.number(),
    }),
    paddle2: z.object({
      y: z.number(),
      height: z.number(),
      width: z.number(),
    }),
    score: z.object({
      player1: z.number(),
      player2: z.number(),
    }),
    status: z.enum(["waiting", "ready", "playing", "paused", "finished"]),
    timestamp: z.number(),
  }),
});

// Game start notification
export const GameStartedSchema = z.object({
  type: z.literal("game_started"),
  data: z.object({
    gameId: z.string(),
    player1: z.object({
      id: z.string(),
      nickname: z.string(),
    }),
    player2: z.object({
      id: z.string(),
      nickname: z.string(),
    }),
    startTime: z.number(),
  }),
});

// Score update notification
export const ScoreUpdateSchema = z.object({
  type: z.literal("score_update"),
  data: z.object({
    gameId: z.string(),
    scorer: z.enum(["player1", "player2"]),
    score: z.object({
      player1: z.number(),
      player2: z.number(),
    }),
  }),
});

// Game end notification
export const GameEndSchema = z.object({
  type: z.literal("game_end"),
  data: z.object({
    gameId: z.string(),
    winner: z.string().nullable(), // userId or "player1"/"player2" (null for draw)
    finalScore: z.object({
      player1: z.number(),
      player2: z.number(),
    }),
    reason: z.enum(["finished", "forfeit", "disconnect", "cancelled"]),
    stats: z
      .object({
        duration: z.number(), // seconds
        totalHits: z.number(),
        player1Accuracy: z.number(), // percentage
        player2Accuracy: z.number(),
      })
      .optional(),
  }),
});

// Player joined notification
export const PlayerJoinedSchema = z.object({
  type: z.literal("player_joined"),
  data: z.object({
    gameId: z.string(),
    playerId: z.string(),
    nickname: z.string(),
    playerNumber: z.enum(["player1", "player2"]),
  }),
});

// Player left notification
export const PlayerLeftSchema = z.object({
  type: z.literal("player_left"),
  data: z.object({
    gameId: z.string(),
    playerId: z.string(),
    playerNumber: z.enum(["player1", "player2"]),
    reason: z.enum(["disconnect", "quit"]),
  }),
});

// Error notification
export const ErrorMessageSchema = z.object({
  type: z.literal("error"),
  data: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

// Ping/pong for connection health
export const PingSchema = z.object({
  type: z.literal("ping"),
  data: z.object({
    timestamp: z.number(),
  }),
});

export const PongSchema = z.object({
  type: z.literal("pong"),
  data: z.object({
    timestamp: z.number(),
  }),
});

// ============================================================================
// RECONNECTION & DISCONNECTION SCHEMAS
// ============================================================================

// Player disconnected notification (with reconnect window)
export const PlayerDisconnectedSchema = z.object({
  type: z.literal("player_disconnected"),
  data: z.object({
    gameId: z.string(),
    playerId: z.string(),
    playerNumber: z.enum(["player1", "player2"]),
    message: z.string(),
    reconnectTimeoutMs: z.number(),
  }),
});

// Player timeout notification (failed to reconnect)
export const PlayerTimeoutSchema = z.object({
  type: z.literal("player_timeout"),
  data: z.object({
    gameId: z.string(),
    playerId: z.string(),
    playerNumber: z.enum(["player1", "player2"]),
    message: z.string(),
  }),
});

// Full state snapshot (sent on reconnect)
export const FullStateSnapshotSchema = z.object({
  type: z.literal("full_state_snapshot"),
  data: z.object({
    gameId: z.string(),
    ball: z.object({
      x: z.number(),
      y: z.number(),
      vx: z.number(),
      vy: z.number(),
      radius: z.number(),
    }),
    paddle1: z.object({
      y: z.number(),
      height: z.number(),
      width: z.number(),
    }),
    paddle2: z.object({
      y: z.number(),
      height: z.number(),
      width: z.number(),
    }),
    score: z.object({
      player1: z.number(),
      player2: z.number(),
    }),
    status: z.enum(["waiting", "ready", "playing", "paused", "finished"]),
    players: z.array(z.object({
      playerId: z.string(),
      nickname: z.string(),
      playerNumber: z.enum(["player1", "player2"]),
      isConnected: z.boolean(),
    })),
    timestamp: z.number(),
  }),
});

// Game resumed notification
export const GameResumedSchema = z.object({
  type: z.literal("game_resumed"),
  data: z.object({
    gameId: z.string(),
    message: z.string(),
  }),
});

// ============================================================================
// UNION TYPES
// ============================================================================

// All client-to-server messages
export const ClientMessageSchema = z.discriminatedUnion("type", [
  JoinLocalGameSchema,
  JoinOnlineGameSchema,
  PaddleMoveSchema,
  StartGameSchema,
  PauseGameSchema,
  LeaveGameSchema,
  PongSchema, // Client responds to ping
]);

// All server-to-client messages
export const ServerMessageSchema = z.discriminatedUnion("type", [
  GameStateSchema,
  GameStartedSchema,
  ScoreUpdateSchema,
  GameEndSchema,
  PlayerJoinedSchema,
  PlayerLeftSchema,
  ErrorMessageSchema,
  PingSchema, // Server pings client
  PlayerDisconnectedSchema,
  PlayerTimeoutSchema,
  FullStateSnapshotSchema,
  GameResumedSchema,
]);

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type JoinLocalGame = z.infer<typeof JoinLocalGameSchema>;
export type JoinOnlineGame = z.infer<typeof JoinOnlineGameSchema>;
export type PaddleMove = z.infer<typeof PaddleMoveSchema>;
export type StartGame = z.infer<typeof StartGameSchema>;
export type PauseGame = z.infer<typeof PauseGameSchema>;
export type LeaveGame = z.infer<typeof LeaveGameSchema>;

export type GameState = z.infer<typeof GameStateSchema>;
export type GameStarted = z.infer<typeof GameStartedSchema>;
export type ScoreUpdate = z.infer<typeof ScoreUpdateSchema>;
export type GameEnd = z.infer<typeof GameEndSchema>;
export type PlayerJoined = z.infer<typeof PlayerJoinedSchema>;
export type PlayerLeft = z.infer<typeof PlayerLeftSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type Ping = z.infer<typeof PingSchema>;
export type Pong = z.infer<typeof PongSchema>;
export type PlayerDisconnected = z.infer<typeof PlayerDisconnectedSchema>;
export type PlayerTimeout = z.infer<typeof PlayerTimeoutSchema>;
export type FullStateSnapshot = z.infer<typeof FullStateSnapshotSchema>;
export type GameResumed = z.infer<typeof GameResumedSchema>;

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Parse incoming WebSocket message
export function parseClientMessage(raw: string): ClientMessage {
  try {
    const json = JSON.parse(raw);
    return ClientMessageSchema.parse(json);
  } catch (error) {
    throw new Error(`Invalid client message: ${error}`);
  }
}

// Create server message
export function createServerMessage(message: ServerMessage): string {
  return JSON.stringify(message);
}

// Create error message
export function createErrorMessage(code: string, message: string, details?: any): string {
  return createServerMessage({
    type: "error",
    data: { code, message, details },
  });
}
