// WebSocket message types
export type WSMessageType =
  | 'join_local_game'
  | 'join_matchmaking'
  | 'cancel_matchmaking'
  | 'paddle_move'
  | 'game_ready'
  | 'game_created'
  | 'game_state'
  | 'game_end'
  | 'matchmaking_found'
  | 'error';

export interface WSMessage<T = any> {
  type: WSMessageType;
  data: T;
}

// Client -> Server messages
export interface JoinLocalGameMessage {
  player1_nickname: string;
  player2_nickname: string;
  max_score?: number;
}

export interface JoinMatchmakingMessage {
  user_id: number;
  nickname: string;
  token: string;
}

export interface PaddleMoveMessage {
  player: 1 | 2;
  y: number; // 0-100 normalized position
}

export interface GameReadyMessage {
  player: 1 | 2;
}

// Server -> Client messages
export interface GameCreatedMessage {
  game_id: string;
  player1: {
    id?: number;
    nickname: string;
  };
  player2: {
    id?: number;
    nickname: string;
  };
  max_score: number;
}

export interface GameStateMessage {
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  paddle1: {
    y: number;
  };
  paddle2: {
    y: number;
  };
  score: {
    player1: number;
    player2: number;
  };
  timestamp: number;
}

export interface GameEndMessage {
  game_id: string;
  winner: {
    id?: number;
    nickname: string;
  };
  final_score: {
    player1: number;
    player2: number;
  };
  duration: number;
}

export interface MatchmakingFoundMessage {
  game_id: string;
  opponent: {
    id: number;
    nickname: string;
    rank_points: number;
  };
}

// Game physics types
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  score: {
    player1: number;
    player2: number;
  };
}
