import { WebSocket } from "ws";
import {
  createGameState,
  updatePhysics,
  setPaddleDirection,
  isGameOver,
  getWinner,
  serializeGameState,
  GamePhysicsState,
  setPaused,
  type Paddle,
} from "../physics/engine.js";
import { createServerMessage } from "./messages.js";
import type { GameMode } from "../types/game.types.js";

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerConnection {
  ws: WebSocket;
  playerId: string;
  nickname: string;
  playerNumber: "player1" | "player2";
  lastPing: number;
}

export interface ActiveGame {
  gameId: string;
  mode: GameMode;
  physics: GamePhysicsState;
  players: Map<string, PlayerConnection>; // playerId -> connection
  status: "waiting" | "ready" | "playing" | "paused" | "finished";
  startTime?: number;
  endTime?: number;
  loopInterval?: NodeJS.Timeout;
  createdAt: number;
}

// ============================================================================
// STATE MANAGER (In-Memory Storage)
// ============================================================================

export class GameStateManager {
  private games: Map<string, ActiveGame> = new Map();
  private playerToGame: Map<string, string> = new Map(); // playerId -> gameId

  /**
   * Create new game instance
   */
  createGame(gameId: string, mode: GameMode, maxScore: number = 11): ActiveGame {
    const game: ActiveGame = {
      gameId,
      mode,
      physics: createGameState(maxScore),
      players: new Map(),
      status: "waiting",
      createdAt: Date.now(),
    };

    this.games.set(gameId, game);
    return game;
  }

  /**
   * Get game by ID
   */
  getGame(gameId: string): ActiveGame | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get game by player ID
   */
  getGameByPlayer(playerId: string): ActiveGame | undefined {
    const gameId = this.playerToGame.get(playerId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  /**
   * Add player to game
   */
  addPlayer(
    gameId: string,
    playerId: string,
    nickname: string,
    ws: WebSocket,
    playerNumber?: "player1" | "player2"
  ): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    // Check if game is full
    if (game.players.size >= 2) return false;

    // Determine player number
    let assignedNumber = playerNumber;
    if (!assignedNumber) {
      const existingNumbers = Array.from(game.players.values()).map((p) => p.playerNumber);
      assignedNumber = existingNumbers.includes("player1") ? "player2" : "player1";
    }

    const player: PlayerConnection = {
      ws,
      playerId,
      nickname,
      playerNumber: assignedNumber,
      lastPing: Date.now(),
    };

    game.players.set(playerId, player);
    this.playerToGame.set(playerId, gameId);

    // If 2 players joined, set status to ready
    if (game.players.size === 2) {
      game.status = "ready";
    }

    return true;
  }

  /**
   * Remove player from game
   */
  removePlayer(playerId: string): void {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.players.delete(playerId);
    this.playerToGame.delete(playerId);

    // If game is in progress and player left, end game
    if (game.status === "playing") {
      this.endGame(gameId, "forfeit");
    }

    // If game is empty, remove it
    if (game.players.size === 0) {
      this.deleteGame(gameId);
    }
  }

  /**
   * Start game loop
   */
  startGame(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game || game.status !== "ready") return false;

    game.status = "playing";
    game.startTime = Date.now();

    // Start 60 FPS game loop
    game.loopInterval = setInterval(() => {
      this.gameLoop(gameId);
    }, 16); // ~60 FPS (16.67ms)

    // Broadcast game started
    this.broadcastToGame(gameId, {
      type: "game_started",
      data: {
        gameId,
        player1: this.getPlayerInfo(game, "player1"),
        player2: this.getPlayerInfo(game, "player2"),
        startTime: game.startTime!,
      },
    });

    return true;
  }

  /**
   * Main game loop (called every frame)
   */
  private gameLoop(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game || game.status !== "playing") {
      this.stopGameLoop(gameId);
      return;
    }

    // Update physics
    const result = updatePhysics(game.physics);

    // Check if someone scored
    if (result.scored && result.scorer) {
      this.broadcastToGame(gameId, {
        type: "score_update",
        data: {
          gameId,
          scorer: result.scorer,
          score: {
            player1: game.physics.score.player1,
            player2: game.physics.score.player2,
          },
        },
      });
    }

    // Check if game is over
    if (isGameOver(game.physics)) {
      this.endGame(gameId, "finished");
      return;
    }

    // Broadcast game state to all players
    this.broadcastGameState(gameId);
  }

  /**
   * Broadcast game state to all players
   */
  private broadcastGameState(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    const state = serializeGameState(game.physics);
    const message = createServerMessage({
      type: "game_state",
      data: {
        gameId,
        ...state,
        status: game.status,
        timestamp: Date.now(),
      },
    });

    this.broadcastRaw(gameId, message);
  }

  /**
   * End game
   */
  endGame(gameId: string, reason: "finished" | "forfeit" | "disconnect" | "cancelled"): void {
    const game = this.games.get(gameId);
    if (!game) return;

    // Stop game loop
    this.stopGameLoop(gameId);

    game.status = "finished";
    game.endTime = Date.now();

    const winner = getWinner(game.physics);
    const winnerPlayer = winner
      ? Array.from(game.players.values()).find((p) => p.playerNumber === winner)
      : null;

    // Broadcast game end
    this.broadcastToGame(gameId, {
      type: "game_end",
      data: {
        gameId,
        winner: winnerPlayer?.playerId || null,
        finalScore: {
          player1: game.physics.score.player1,
          player2: game.physics.score.player2,
        },
        reason,
        stats: {
          duration: game.startTime ? Math.floor((Date.now() - game.startTime) / 1000) : 0,
          totalHits: 0, // TODO: Track hits
          player1Accuracy: 0, // TODO: Calculate accuracy
          player2Accuracy: 0,
        },
      },
    });

    // Clean up after 5 seconds
    setTimeout(() => {
      this.deleteGame(gameId);
    }, 5000);
  }

  /**
   * Stop game loop
   */
  private stopGameLoop(gameId: string): void {
    const game = this.games.get(gameId);
    if (game?.loopInterval) {
      clearInterval(game.loopInterval);
      delete game.loopInterval;
    }
  }

  /**
   * Pause/resume game
   */
  pauseGame(gameId: string, paused: boolean): boolean {
    const game = this.games.get(gameId);
    if (!game || game.status !== "playing") return false;

    setPaused(game.physics, paused);
    game.status = paused ? "paused" : "playing";

    return true;
  }

  /**
   * Update paddle direction
   */
  updatePaddle(gameId: string, playerId: string, direction: "up" | "down" | "stop"): boolean {
    const game = this.games.get(gameId);
    if (!game || game.status !== "playing") return false;

    const player = game.players.get(playerId);
    if (!player) return false;

    const paddle: Paddle = player.playerNumber === "player1" ? game.physics.paddle1 : game.physics.paddle2;
    setPaddleDirection(paddle, direction);

    return true;
  }

  /**
   * Delete game
   */
  deleteGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    // Stop game loop
    this.stopGameLoop(gameId);

    // Remove player mappings
    for (const playerId of game.players.keys()) {
      this.playerToGame.delete(playerId);
    }

    // Remove game
    this.games.delete(gameId);
  }

  /**
   * Broadcast message to all players in game
   */
  broadcastToGame(gameId: string, message: any): void {
    const raw = typeof message === "string" ? message : createServerMessage(message);
    this.broadcastRaw(gameId, raw);
  }

  /**
   * Broadcast raw message to all players in game
   */
  private broadcastRaw(gameId: string, message: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    for (const player of game.players.values()) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message);
      }
    }
  }

  /**
   * Send message to specific player
   */
  sendToPlayer(playerId: string, message: any): boolean {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return false;

    const game = this.games.get(gameId);
    if (!game) return false;

    const player = game.players.get(playerId);
    if (!player || player.ws.readyState !== WebSocket.OPEN) return false;

    const raw = typeof message === "string" ? message : createServerMessage(message);
    player.ws.send(raw);
    return true;
  }

  /**
   * Get player info helper
   */
  private getPlayerInfo(game: ActiveGame, playerNumber: "player1" | "player2") {
    const player = Array.from(game.players.values()).find((p) => p.playerNumber === playerNumber);
    return {
      id: player?.playerId || "unknown",
      nickname: player?.nickname || "Unknown",
    };
  }

  /**
   * Get all active games
   */
  getActiveGames(): ActiveGame[] {
    return Array.from(this.games.values()).filter((g) => g.status === "playing");
  }

  /**
   * Get game count
   */
  getGameCount(): number {
    return this.games.size;
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.playerToGame.size;
  }

  /**
   * Clean up old games (call periodically)
   */
  cleanupOldGames(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [gameId, game] of this.games.entries()) {
      if (game.status === "finished" || now - game.createdAt > maxAgeMs) {
        this.deleteGame(gameId);
      }
    }
  }
}
