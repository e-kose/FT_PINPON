/**
 * Game Types
 * Core type definitions for the game service
 */

export enum GameMode {
  LOCAL = 'local',
  MATCHMAKING = 'matchmaking',
  TOURNAMENT = 'tournament',
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface UserConnection {
  socket: any;
}

export enum PlayerPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum InputAction {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  STOP = 'stop',
}

interface Vector2D {
  x: number;
  y: number;
}

export interface Paddle {
  position: Vector2D;
  width: number;
  height: number;
  speed: number;
  velocity: number;
}

export interface Ball {
  position: Vector2D;
  radius: number;
  velocity: Vector2D;
  speed: number;
}

export interface Player {
  id: string;
  position: PlayerPosition;
  score: number;
  paddle: Paddle;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  paddleWidth: number;
  paddleHeight: number;
  paddleSpeed: number;
  ballRadius: number;
  ballSpeed: number;
  maxScore: number;
  fps: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  paddleWidth: 10,
  paddleHeight: 100,
  paddleSpeed: 5,
  ballRadius: 8,
  ballSpeed: 4,
  maxScore: 5,
  fps: 60,
};

export interface GameState {
  roomId: string;
  mode: GameMode;
  status: GameStatus;
  players: {
    left: Player;
    right: Player;
  };
  ball: Ball;
  config: GameConfig;
  lastUpdate: number;
}

export enum WSClientMessageType {
  CREATE_LOCAL_GAME = 'CREATE_LOCAL_GAME',
  JOIN_MATCHMAKING = 'JOIN_MATCHMAKING',
  LEAVE_MATCHMAKING = 'LEAVE_MATCHMAKING',
  PLAYER_INPUT = 'PLAYER_INPUT',
  LEAVE_ROOM = 'LEAVE_ROOM',
  PING = 'PING',
  CREATE_TOURNAMENT = 'CREATE_TOURNAMENT',
  JOIN_TOURNAMENT = 'JOIN_TOURNAMENT',
  LEAVE_TOURNAMENT = 'LEAVE_TOURNAMENT',
  JOIN_TOURNAMENT_QUEUE = 'JOIN_TOURNAMENT_QUEUE',
  LEAVE_TOURNAMENT_QUEUE = 'LEAVE_TOURNAMENT_QUEUE',
}

export enum WSServerMessageType {
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  PONG = 'PONG',
  ROOM_CREATED = 'ROOM_CREATED',
  ROOM_JOINED = 'ROOM_JOINED',
  ROOM_LEFT = 'ROOM_LEFT',
  PLAYER_ASSIGNED = 'PLAYER_ASSIGNED',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  MATCHMAKING_SEARCHING = 'MATCHMAKING_SEARCHING',
  MATCH_FOUND = 'MATCH_FOUND',
  GAME_STATE = 'GAME_STATE',
  STATE_UPDATE = 'STATE_UPDATE',
  GAME_OVER = 'GAME_OVER',
  TOURNAMENT_CREATED = 'TOURNAMENT_CREATED',
  TOURNAMENT_STATE = 'TOURNAMENT_STATE',
  TOURNAMENT_ERROR = 'TOURNAMENT_ERROR',
  LEAVE_TOURNAMENT = 'LEAVE_TOURNAMENT',
  TOURNAMENT_QUEUE_JOINED = 'TOURNAMENT_QUEUE_JOINED',
  TOURNAMENT_QUEUE_LEFT = 'TOURNAMENT_QUEUE_LEFT',
}

export interface WSMessage<T = any> {
  type: string;
  payload?: T;
}

export interface CreateLocalGamePayload {
  config?: Partial<GameConfig>;
}

export interface PlayerInputPayload {
  action: InputAction;
  playerPosition?: PlayerPosition;
}

export interface ConnectedPayload {
  socketId: string;
  userId?: string | undefined;
  timestamp: number;
}

export interface GameStateUpdate {
  roomId: string;
  status: GameStatus;
  players: {
    left: {
      score: number;
      paddle: { y: number };
    };
    right: {
      score: number;
      paddle: { y: number };
    };
  };
  ball: {
    x: number;
    y: number;
  };
  timestamp: number;
}

export interface GameOverData {
  roomId: string;
  winner: PlayerPosition;
  winnerId: string;
  winnerUsername?: string;
  loserId: string;
  loserUsername?: string;
  finalScore: {
    left: number;
    right: number;
  };
  timestamp: number;
}

import type { TournamentData, TournamentSize } from './tournament.types.js';

export interface CreateTournamentPayload {
  size: TournamentSize;
}

export interface JoinTournamentPayload {
  tournamentId: string;
}

export interface TournamentStateUpdatePayload {
  tournament: TournamentData;
}
