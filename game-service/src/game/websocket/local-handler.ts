import { WebSocket } from "ws";
import { GameStateManager } from "./state-manager.js";
import {
  parseClientMessage,
  createServerMessage,
  createErrorMessage,
  type JoinLocalGame,
  type PaddleMove,
} from "./messages.js";

// ============================================================================
// LOCAL GAME HANDLER
// Handles single WebSocket connection with 2 players on same PC
// ============================================================================

export class LocalGameHandler {
  constructor(private stateManager: GameStateManager) {}

  /**
   * Handle WebSocket connection for local game
   */
  handleConnection(ws: WebSocket): void {
    console.log("[LocalGame] New connection");

    let currentGameId: string | undefined;
    let player1Id: string | undefined;
    let player2Id: string | undefined;

    // Handle incoming messages
    ws.on("message", (data: Buffer) => {
      try {
        const raw = data.toString();
        const message = parseClientMessage(raw);

        switch (message.type) {
          case "join_local_game":
            this.handleJoinLocalGame(ws, message, (gameId, p1, p2) => {
              currentGameId = gameId;
              player1Id = p1;
              player2Id = p2;
            });
            break;

          case "paddle_move":
            if (currentGameId) {
              this.handlePaddleMove(currentGameId, message);
            }
            break;

          case "start_game":
            if (currentGameId) {
              this.handleStartGame(currentGameId, ws);
            }
            break;

          case "pause_game":
            if (currentGameId) {
              this.handlePauseGame(currentGameId, message.data.paused, ws);
            }
            break;

          case "leave_game":
            if (currentGameId) {
              this.handleLeaveGame(currentGameId, player1Id, player2Id);
              currentGameId = undefined;
            }
            break;

          case "pong":
            // Heartbeat response
            break;

          default:
            ws.send(createErrorMessage("INVALID_MESSAGE", "Unknown message type"));
        }
      } catch (error: any) {
        console.error("[LocalGame] Message error:", error.message);
        ws.send(createErrorMessage("PARSE_ERROR", error.message));
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      console.log("[LocalGame] Connection closed");
      if (currentGameId && player1Id && player2Id) {
        this.handleLeaveGame(currentGameId, player1Id, player2Id);
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[LocalGame] WebSocket error:", error);
    });

    // Send welcome message
    ws.send(
      createServerMessage({
        type: "player_joined",
        data: {
          gameId: "",
          playerId: "local",
          nickname: "Local Player",
          playerNumber: "player1",
        },
      })
    );

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
   * Handle join local game
   */
  private handleJoinLocalGame(
    ws: WebSocket,
    message: JoinLocalGame,
    callback: (gameId: string, player1Id: string, player2Id: string) => void
  ): void {
    const { gameId, player1Nickname, player2Nickname } = message.data;

    // Get or create game
    let game = this.stateManager.getGame(gameId);
    if (!game) {
      game = this.stateManager.createGame(gameId, "local");
    }

    // Check if game is already full
    if (game.players.size >= 2) {
      ws.send(createErrorMessage("GAME_FULL", "Game is already full"));
      return;
    }

    // Generate player IDs (use nicknames for local games)
    const player1Id = `local_${player1Nickname}_${Date.now()}`;
    const player2Id = `local_${player2Nickname}_${Date.now()}`;

    // Add both players (single WebSocket connection)
    const added1 = this.stateManager.addPlayer(gameId, player1Id, player1Nickname, ws, "player1");
    const added2 = this.stateManager.addPlayer(gameId, player2Id, player2Nickname, ws, "player2");

    if (!added1 || !added2) {
      ws.send(createErrorMessage("JOIN_FAILED", "Failed to join game"));
      return;
    }

    // Notify player 1 joined
    ws.send(
      createServerMessage({
        type: "player_joined",
        data: {
          gameId,
          playerId: player1Id,
          nickname: player1Nickname,
          playerNumber: "player1",
        },
      })
    );

    // Notify player 2 joined
    ws.send(
      createServerMessage({
        type: "player_joined",
        data: {
          gameId,
          playerId: player2Id,
          nickname: player2Nickname,
          playerNumber: "player2",
        },
      })
    );

    // Callback with player IDs
    callback(gameId, player1Id, player2Id);

    console.log(`[LocalGame] Players joined: ${player1Nickname} vs ${player2Nickname} in game ${gameId}`);
  }

  /**
   * Handle paddle movement
   */
  private handlePaddleMove(gameId: string, message: PaddleMove): void {
    const { playerId, direction } = message.data;
    this.stateManager.updatePaddle(gameId, playerId, direction);
  }

  /**
   * Handle start game
   */
  private handleStartGame(gameId: string, ws: WebSocket): void {
    const started = this.stateManager.startGame(gameId);
    if (!started) {
      ws.send(createErrorMessage("START_FAILED", "Cannot start game (not ready or already started)"));
    }
  }

  /**
   * Handle pause game
   */
  private handlePauseGame(gameId: string, paused: boolean, ws: WebSocket): void {
    const success = this.stateManager.pauseGame(gameId, paused);
    if (!success) {
      ws.send(createErrorMessage("PAUSE_FAILED", "Cannot pause game"));
    }
  }

  /**
   * Handle leave game
   */
  private handleLeaveGame(gameId: string, player1Id?: string, player2Id?: string): void {
    if (player1Id) {
      this.stateManager.removePlayer(player1Id);
    }
    if (player2Id) {
      this.stateManager.removePlayer(player2Id);
    }
    console.log(`[LocalGame] Players left game ${gameId}`);
  }
}
