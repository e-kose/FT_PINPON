import { WebSocket } from "ws";
import { GameStateManager } from "./state-manager.js";
import {
  parseClientMessage,
  createServerMessage,
  createErrorMessage,
  type JoinOnlineGame,
  type PaddleMove,
} from "./messages.js";
import { verifyToken } from "../../utils/jwt.utils.js";
import type { JWTPayload } from "../types/game.types.js";

// ============================================================================
// ONLINE GAME HANDLER
// Handles 2 separate WebSocket connections with JWT auth
// ============================================================================

export class OnlineGameHandler {
  private connectionToPlayer: Map<WebSocket, string> = new Map(); // ws -> playerId

  constructor(private stateManager: GameStateManager, private wsClients?: Map<string, Set<WebSocket>>) {}

  /**
   * Handle WebSocket connection for online game
   */
  handleConnection(ws: WebSocket, token?: string): void {
    console.log("[OnlineGame] New connection");

    // Verify JWT token
    let userId: string | undefined;
    let userPayload: JWTPayload | undefined;

    if (token) {
      try {
        userPayload = verifyToken(token);
        userId = userPayload.sub;
        console.log(`[OnlineGame] Authenticated user: ${userId}`);

        // register ws in global clients map for notifications
        if (userId && this.wsClients) {
          const set = this.wsClients.get(userId) || new Set<WebSocket>();
          set.add(ws as any);
          this.wsClients.set(userId, set);
        }
      } catch (error) {
        console.error("[OnlineGame] JWT verification failed:", error);
        ws.send(createErrorMessage("AUTH_FAILED", "Invalid or expired token"));
        ws.close();
        return;
      }
    }

    // Handle incoming messages
    ws.on("message", (data: Buffer) => {
      try {
        const raw = data.toString();
        const message = parseClientMessage(raw);

        switch (message.type) {
          case "join_online_game":
            if (userId) {
              this.handleJoinOnlineGame(ws, userId, userPayload!, message);
            } else {
              ws.send(createErrorMessage("AUTH_REQUIRED", "Authentication required for online games"));
            }
            break;

          case "paddle_move":
            if (userId) {
              this.handlePaddleMove(userId, message);
            }
            break;

          case "start_game":
            if (userId) {
              this.handleStartGame(userId, ws);
            }
            break;

          case "pause_game":
            if (userId) {
              this.handlePauseGame(userId, message.data.paused, ws);
            }
            break;

          case "leave_game":
            if (userId) {
              this.handleLeaveGame(userId, ws);
            }
            break;

          case "pong":
            // Heartbeat response
            break;

          default:
            ws.send(createErrorMessage("INVALID_MESSAGE", "Unknown message type"));
        }
      } catch (error: any) {
        console.error("[OnlineGame] Message error:", error.message);
        ws.send(createErrorMessage("PARSE_ERROR", error.message));
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      console.log("[OnlineGame] Connection closed");
      if (userId) {
        this.handleDisconnect(userId);
        // remove from global clients
        if (userId && this.wsClients) {
          const set = this.wsClients.get(userId);
          if (set) {
            set.delete(ws as any);
            if (set.size === 0) this.wsClients.delete(userId);
          }
        }
      }
      this.connectionToPlayer.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[OnlineGame] WebSocket error:", error);
    });

    // Send welcome message
    if (userId) {
      ws.send(
        createServerMessage({
          type: "player_joined",
          data: {
            gameId: "",
            playerId: userId,
            nickname: userPayload?.username || "Unknown",
            playerNumber: "player1",
          },
        })
      );
    }

    // Start heartbeat
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          createServerMessage({
            type: "ping",
            data: { timestamp: Date.now() },
          })
        );
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Handle join online game
   */
  private handleJoinOnlineGame(ws: WebSocket, userId: string, payload: JWTPayload, message: JoinOnlineGame): void {
    const { gameId } = message.data;

    // Get or create game
    let game = this.stateManager.getGame(gameId);
    if (!game) {
      game = this.stateManager.createGame(gameId, "online");
    }

    // Check if game is already full
    if (game.players.size >= 2) {
      ws.send(createErrorMessage("GAME_FULL", "Game is already full"));
      return;
    }

    // Check if player already in game
    if (game.players.has(userId)) {
      ws.send(createErrorMessage("ALREADY_IN_GAME", "You are already in this game"));
      return;
    }

    // Determine player number
    const playerNumber: "player1" | "player2" = game.players.size === 0 ? "player1" : "player2";

    // Add player
    const added = this.stateManager.addPlayer(gameId, userId, payload.username, ws, playerNumber);

    if (!added) {
      ws.send(createErrorMessage("JOIN_FAILED", "Failed to join game"));
      return;
    }

    // Track connection
    this.connectionToPlayer.set(ws, userId);

    // Broadcast player joined to all players in game
    this.stateManager.broadcastToGame(gameId, {
      type: "player_joined",
      data: {
        gameId,
        playerId: userId,
        nickname: payload.username,
        playerNumber,
      },
    });

    console.log(`[OnlineGame] User ${userId} (${payload.username}) joined game ${gameId} as ${playerNumber}`);

    // If game is ready (2 players), auto-start after 3 seconds
    if (game.players.size === 2) {
      setTimeout(() => {
        const currentGame = this.stateManager.getGame(gameId);
        if (currentGame && currentGame.status === "ready") {
          this.stateManager.startGame(gameId);
          console.log(`[OnlineGame] Auto-started game ${gameId}`);
        }
      }, 3000);
    }
  }

  /**
   * Handle paddle movement
   */
  private handlePaddleMove(userId: string, message: PaddleMove): void {
    const game = this.stateManager.getGameByPlayer(userId);
    if (!game) return;

    this.stateManager.updatePaddle(game.gameId, userId, message.data.direction);
  }

  /**
   * Handle start game
   */
  private handleStartGame(userId: string, ws: WebSocket): void {
    const game = this.stateManager.getGameByPlayer(userId);
    if (!game) {
      ws.send(createErrorMessage("NOT_IN_GAME", "You are not in a game"));
      return;
    }

    const started = this.stateManager.startGame(game.gameId);
    if (!started) {
      ws.send(createErrorMessage("START_FAILED", "Cannot start game (not ready or already started)"));
    }
  }

  /**
   * Handle pause game
   */
  private handlePauseGame(userId: string, paused: boolean, ws: WebSocket): void {
    const game = this.stateManager.getGameByPlayer(userId);
    if (!game) {
      ws.send(createErrorMessage("NOT_IN_GAME", "You are not in a game"));
      return;
    }

    const success = this.stateManager.pauseGame(game.gameId, paused);
    if (!success) {
      ws.send(createErrorMessage("PAUSE_FAILED", "Cannot pause game"));
    }
  }

  /**
   * Handle leave game
   */
  private handleLeaveGame(userId: string, ws: WebSocket): void {
    const game = this.stateManager.getGameByPlayer(userId);
    if (!game) {
      ws.send(createErrorMessage("NOT_IN_GAME", "You are not in a game"));
      return;
    }

    // Get player info before removing
    const player = game.players.get(userId);
    if (player) {
      // Notify other players
      this.stateManager.broadcastToGame(game.gameId, {
        type: "player_left",
        data: {
          gameId: game.gameId,
          playerId: userId,
          playerNumber: player.playerNumber,
          reason: "quit",
        },
      });
    }

    this.stateManager.removePlayer(userId);
    this.connectionToPlayer.delete(ws);
    console.log(`[OnlineGame] User ${userId} left game ${game.gameId}`);
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(userId: string): void {
    const game = this.stateManager.getGameByPlayer(userId);
    if (!game) return;

    const player = game.players.get(userId);
    if (player) {
      // Notify other players
      this.stateManager.broadcastToGame(game.gameId, {
        type: "player_left",
        data: {
          gameId: game.gameId,
          playerId: userId,
          playerNumber: player.playerNumber,
          reason: "disconnect",
        },
      });
    }

    this.stateManager.removePlayer(userId);
    console.log(`[OnlineGame] User ${userId} disconnected from game ${game.gameId}`);
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.connectionToPlayer.size;
  }
}
