import createError from "@fastify/error";

// Game errors
export const GameNotFoundError = createError(
  "GAME_NOT_FOUND",
  "Game with id %s not found",
  404
);

export const GameAlreadyStartedError = createError(
  "GAME_ALREADY_STARTED",
  "Game has already started",
  400
);

export const GameAlreadyFinishedError = createError(
  "GAME_ALREADY_FINISHED",
  "Game has already finished",
  400
);

export const InvalidGameModeError = createError(
  "INVALID_GAME_MODE",
  "Invalid game mode: %s",
  400
);

// Matchmaking errors
export const AlreadyInQueueError = createError(
  "ALREADY_IN_QUEUE",
  "User is already in matchmaking queue",
  400
);

export const NotInQueueError = createError(
  "NOT_IN_QUEUE",
  "User is not in matchmaking queue",
  400
);

export const MatchmakingTimeoutError = createError(
  "MATCHMAKING_TIMEOUT",
  "Matchmaking timeout - no opponent found",
  408
);

// Tournament errors
export const TournamentNotFoundError = createError(
  "TOURNAMENT_NOT_FOUND",
  "Tournament with id %s not found",
  404
);

export const TournamentFullError = createError(
  "TOURNAMENT_FULL",
  "Tournament is full",
  400
);

export const TournamentAlreadyStartedError = createError(
  "TOURNAMENT_ALREADY_STARTED",
  "Tournament has already started",
  400
);

export const AlreadyInTournamentError = createError(
  "ALREADY_IN_TOURNAMENT",
  "User is already registered in this tournament",
  400
);

export const UnauthorizedError = createError(
  "UNAUTHORIZED",
  "Unauthorized access",
  401
);
