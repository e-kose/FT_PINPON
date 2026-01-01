/**
 * WebSocket Controller
 * Handles persistent WebSocket connections and message routing
 * One connection per user, games are rooms that sockets join/leave dynamically
 */

interface UserConnection {
  socket: WebSocket;
  socketId: string; // Added implicit socketId tracking
  userId?: string | undefined;
  currentRoomId?: string | undefined;
  // Track if user is in a tournament to avoid multi-queuing
  currentTournamentId?: string | undefined;
  connectedAt: number;
}

import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { GameService } from '../service/game.service.js';
import { DatabaseService } from '../../plugins/db.service.js';
import {
  WSClientMessageType,
  WSServerMessageType,
  PlayerPosition,
  GameMode,
  type WSMessage,
  type SetUserIdPayload,
  type CreateLocalGamePayload,
  type PlayerInputPayload,
  type ConnectedPayload,
  type ErrorPayload,
  type RoomCreatedPayload,
  type PlayerAssignedPayload,
  type MatchmakingSearchingPayload,
  type MatchFoundPayload,
  type GameStateUpdate,
  type GameOverData,
  type PlayerDisconnectedPayload,
  type PlayerReconnectedPayload,
  type CreateTournamentPayload,
  type JoinTournamentPayload,
  type TournamentStateUpdatePayload,
} from '../types/game.types.js';
import type { TournamentSize } from '../types/tournament.types.js';

export class GameWebSocketController {
  private gameService: GameService;
  private dbService: DatabaseService;
  private userSockets: Map<string, UserConnection> = new Map();
  private userIdToSocketId: Map<string, string> = new Map();
  private roomSockets: Map<string, Set<string>> = new Map();
  // Map to track sockets subscribed to tournament updates
  private tournamentSockets: Map<string, Set<string>> = new Map();
  private socketIdCounter = 0;

  constructor(gameService: GameService, dbService: DatabaseService) {
    this.gameService = gameService;
    this.dbService = dbService;
    this.setupMatchmakingListeners();
    this.setupTournamentListeners();
  }

  private setupMatchmakingListeners(): void {
    this.gameService.getRoomManager().on('matchFound', (data: any) => {
      const { roomId, player1, player2 } = data;
      console.log(`[MATCH_FOUND] roomId: ${roomId}, player1: ${player1}, player2: ${player2}`);

      const socket1Id = this.userIdToSocketId.get(player1);
      const socket2Id = this.userIdToSocketId.get(player2);

      const startGame = (conn1: UserConnection, conn2: UserConnection) => {
        this.addSocketToRoom(conn1.socketId, roomId);
        this.addSocketToRoom(conn2.socketId, roomId);

        this.sendMessage<MatchFoundPayload>(conn1.socket, {
          type: WSServerMessageType.MATCH_FOUND,
          payload: {
            roomId,
            opponentId: player2,
            playerPosition: PlayerPosition.LEFT,
            timestamp: Date.now(),
          },
        });

        this.sendMessage<MatchFoundPayload>(conn2.socket, {
          type: WSServerMessageType.MATCH_FOUND,
          payload: {
            roomId,
            opponentId: player1,
            playerPosition: PlayerPosition.RIGHT,
            timestamp: Date.now(),
          },
        });

        const room = this.gameService.getRoom(roomId);
        if (room) {
          this.setupRoomListeners(room);
          room.start();
        }
      };

      if (socket1Id && socket2Id) {
        const conn1 = this.userSockets.get(socket1Id);
        const conn2 = this.userSockets.get(socket2Id);

        if (conn1 && conn2) {
          // Inject socketId into UserConnection for convenience if not modifying type
          (conn1 as any).socketId = socket1Id;
          (conn2 as any).socketId = socket2Id;
          startGame(conn1, conn2);
        }
      }

      // Handle case where players are in tournament (might not be in matchmaking queue)
      // For tournament matches, we just need to notify them if they are connected
    });
  }

  private setupTournamentListeners(): void {
    this.gameService.getTournamentManager().on('tournamentUpdate', (event: any) => {
      const { tournamentId, data } = event;
      this.broadcastToTournament(tournamentId, {
        type: WSServerMessageType.TOURNAMENT_STATE,
        payload: data
      });
    });

    this.gameService.getTournamentManager().on('tournamentMatchStarted', (event: any) => {
      // ... (existing match started logic)
      const { tournamentId, roomId, player1Id, player2Id } = event;
      // ...
      // (Copying existing match started logic for brevity, assuming I am replacing setupTournamentListeners completely)
      // Actually, to avoid rewriting the whole method and risking specific content match fail, I will just append the new listener if possible.
      // But since I am replacing the method, I must include previous content.

      console.log(`[TOURNAMENT] Match started in ${tournamentId}: ${player1Id} vs ${player2Id} (Room: ${roomId})`);
      // ... (Match logic)
      const socket1Id = this.userIdToSocketId.get(player1Id);
      const socket2Id = this.userIdToSocketId.get(player2Id);

      const joinPlayer = (socketId: string | undefined, opponentId: string, position: PlayerPosition) => {
        if (!socketId) return;
        const conn = this.userSockets.get(socketId);
        if (conn) {
          this.addSocketToRoom(socketId, roomId);
          this.sendMessage(conn.socket, {
            type: WSServerMessageType.MATCH_FOUND,
            payload: { roomId, opponentId, playerPosition: position, timestamp: Date.now() }
          });
        }
      };
      joinPlayer(socket1Id, player2Id, PlayerPosition.LEFT);
      joinPlayer(socket2Id, player1Id, PlayerPosition.RIGHT);

      const room = this.gameService.getRoom(roomId);
      if (room) { this.setupRoomListeners(room); room.start(); }
    });

    // NEW: Listen for auto-started tournaments from queue
    this.gameService.getTournamentManager().on('tournamentStarted', (event: any) => {
      const { tournamentId, players, size } = event;
      console.log(`[TOURNAMENT_STARTED] Auto-started ${tournamentId} for ${players.length} players`);

      players.forEach((userId: string) => {
        const socketId = this.userIdToSocketId.get(userId);
        if (socketId) {
          const conn = this.userSockets.get(socketId);
          if (conn) {
            conn.currentTournamentId = tournamentId;
            this.addSocketToTournament(socketId, tournamentId);

            this.sendMessage(conn.socket, {
              type: WSServerMessageType.TOURNAMENT_CREATED, // Or JOINED
              payload: { tournamentId, timestamp: Date.now() }
            });

            // Send initial state
            const t = this.gameService.getTournament(tournamentId);
            if (t) {
              this.sendMessage(conn.socket, {
                type: WSServerMessageType.TOURNAMENT_STATE,
                payload: { tournament: t.getData() }
              });
            }
          }
        }
      });
    });
  }

  public async handleConnection(socket: WebSocket, request: FastifyRequest): Promise<void> {
    const userId = request.headers['x-user-id'] as string | undefined;
    const socketId = this.generateSocketId();

    // Check if user is reconnecting
    // Updated: No reconnection logic.
    // If user was disconnected, they lost.
    // New connection starts fresh.

    const userConnection: UserConnection = {
      socket,
      socketId,
      userId,
      connectedAt: Date.now(),
    };

    this.userSockets.set(socketId, userConnection);

    if (userId) {
      const oldSocketId = this.userIdToSocketId.get(userId);
      if (oldSocketId) {
        const oldConnection = this.userSockets.get(oldSocketId);
        if (oldConnection) {
          this.sendError(oldConnection.socket, 'New connection established');
          oldConnection.socket.close();
          this.handleDisconnect(oldSocketId);
        }
      }
      this.userIdToSocketId.set(userId, socketId);

      // Check if user is in an active tournament
      const tournament = this.gameService.getTournamentByPlayer(userId);
      if (tournament) {
        userConnection.currentTournamentId = tournament.id;
        this.addSocketToTournament(socketId, tournament.id);
        // Send current state
        this.sendMessage(socket, {
          type: WSServerMessageType.TOURNAMENT_STATE,
          payload: { tournament: tournament.getData() }
        });
      }
    }

    this.sendMessage<ConnectedPayload>(socket, {
      type: WSServerMessageType.CONNECTED,
      payload: {
        socketId,
        userId,
        timestamp: Date.now(),
      },
    });

    request.log.info({ socketId, userId }, 'WebSocket connected');

    socket.on('message', (data: Buffer) => {
      this.handleMessage(socketId, data, request);
    });

    socket.on('close', () => {
      this.handleDisconnect(socketId);
    });

    socket.on('error', (error: Error) => {
      request.log.error({ socketId, error }, 'WebSocket error');
      this.handleDisconnect(socketId);
    });
  }

  private generateSocketId(): string {
    return `socket_${++this.socketIdCounter}_${Date.now()}`;
  }

  private handleMessage(socketId: string, data: Buffer, request: FastifyRequest): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    try {
      const message: WSMessage = JSON.parse(data.toString());

      request.log.debug({ socketId, type: message.type }, 'Message received');

      switch (message.type) {
        case WSClientMessageType.SET_USER_ID:
          this.handleSetUserId(socketId, message.payload);
          break;

        case WSClientMessageType.CREATE_LOCAL_GAME:
          this.handleCreateLocalGame(socketId, message.payload);
          break;

        case WSClientMessageType.JOIN_MATCHMAKING:
          this.handleJoinMatchmaking(socketId);
          break;

        case WSClientMessageType.LEAVE_MATCHMAKING:
          this.handleLeaveMatchmaking(socketId);
          break;

        // Manual creation/join removed
        /*
        case WSClientMessageType.CREATE_TOURNAMENT:
          this.handleCreateTournament(socketId, message.payload);
          break;

        case WSClientMessageType.JOIN_TOURNAMENT:
          this.handleJoinTournament(socketId, message.payload);
          break;
        */

        case WSClientMessageType.LEAVE_TOURNAMENT:
          this.handleLeaveTournament(socketId);
          break;

        case WSClientMessageType.JOIN_TOURNAMENT_QUEUE:
          this.handleJoinTournamentQueue(socketId, message.payload);
          break;

        case WSClientMessageType.LEAVE_TOURNAMENT_QUEUE:
          this.handleLeaveTournamentQueue(socketId);
          break;

        case WSClientMessageType.PLAYER_INPUT:
          this.handlePlayerInput(socketId, message.payload);
          break;

        case WSClientMessageType.LEAVE_ROOM:
          this.handleLeaveRoom(socketId);
          break;

        case WSClientMessageType.PING:
          this.sendMessage(userConnection.socket, {
            type: WSServerMessageType.PONG,
            payload: { timestamp: Date.now() },
          });
          break;

        default:
          this.sendError(userConnection.socket, `Unknown message type: ${message.type}`);
      }
    } catch (error: any) {
      request.log.error({ socketId, error }, 'Error parsing message');
      this.sendError(userConnection.socket, 'Invalid message format');
    }
  }

  private handleSetUserId(socketId: string, payload: any): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { userId } = payload;
    console.log(`[SET_USER_ID] socketId: ${socketId}, userId: ${userId}`);

    if (!userId || typeof userId !== 'string') {
      console.log(`[SET_USER_ID] ERROR: Invalid user ID`);
      this.sendError(userConnection.socket, 'Invalid user ID');
      return;
    }

    // Check if this user ID is already connected
    const existingSocketId = this.userIdToSocketId.get(userId);
    if (existingSocketId && existingSocketId !== socketId) {
      const existingConnection = this.userSockets.get(existingSocketId);
      if (existingConnection) {
        console.log(`[SET_USER_ID] User ${userId} already connected on ${existingSocketId}, closing old connection`);
        this.sendError(existingConnection.socket, 'New connection established with your user ID');
        existingConnection.socket.close();
        this.handleDisconnect(existingSocketId);
      }
    }

    // Remove old mapping if user had a different ID
    if (userConnection.userId) {
      this.userIdToSocketId.delete(userConnection.userId);
    }

    // Update user connection
    userConnection.userId = userId;
    this.userIdToSocketId.set(userId, socketId);

    console.log(`[SET_USER_ID] Updated: ${userId} -> ${socketId}`);
  }

  // ... existing methods (handleCreateLocalGame, Join/Leave Matchmaking)
  private handleCreateLocalGame(socketId: string, payload?: CreateLocalGamePayload): void {
    // (Kept as is, just collapsed for brevity in this replace, assume it's there)
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;
    const userId = userConnection.userId || `guest-${socketId}`;
    try {
      const { roomId, room } = this.gameService.createLocalGame(userId, payload?.config);
      this.addSocketToRoom(socketId, roomId);
      this.sendMessage(userConnection.socket, { type: WSServerMessageType.ROOM_CREATED, payload: { roomId, mode: room.mode, timestamp: Date.now() } });
      this.sendMessage(userConnection.socket, { type: WSServerMessageType.PLAYER_ASSIGNED, payload: { playerPosition: PlayerPosition.LEFT, userId: `${userId}-p1` } });
      this.sendMessage(userConnection.socket, { type: WSServerMessageType.PLAYER_ASSIGNED, payload: { playerPosition: PlayerPosition.RIGHT, userId: `${userId}-p2` } });
      this.setupRoomListeners(room);
      room.start();
    } catch (e: any) { this.sendError(userConnection.socket, e.message); }
  }

  private handleJoinMatchmaking(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection?.userId) { this.sendError(userConnection?.socket as any, 'User ID required'); return; }

    // Prevent joining queue if already in a game
    if (userConnection.currentRoomId) {
      const room = this.gameService.getRoom(userConnection.currentRoomId);
      if (!room) {
        console.log(`[AUTO-FIX] User ${userConnection.userId} stuck in non-existent room ${userConnection.currentRoomId}. Clearing.`);
        userConnection.currentRoomId = undefined;
      } else {
        console.log(`[JOIN_FAIL] User ${userConnection.userId} already in room ${userConnection.currentRoomId}`);
        this.sendError(userConnection.socket, 'Already in a game');
        return;
      }
    }

    try {
      this.gameService.joinMatchmaking(userConnection.userId);
      this.sendMessage(userConnection.socket, { type: WSServerMessageType.MATCHMAKING_SEARCHING, payload: { message: 'Searching...', timestamp: Date.now() } });
    } catch (e: any) { this.sendError(userConnection.socket, e.message); }
  }

  private handleLeaveMatchmaking(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection?.userId) return;
    this.gameService.leaveMatchmaking(userConnection.userId);
    this.sendMessage(userConnection.socket, { type: WSServerMessageType.ROOM_LEFT, payload: { message: 'Left queue', timestamp: Date.now() } });
  }

  // ==================================================================================
  // Tournament Handlers
  // ==================================================================================

  // Manual creation/joining removed in favor of Queue system
  // private handleCreateTournament ... removed
  // private handleJoinTournament ... removed

  private handleLeaveTournament(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection || !userConnection.userId || !userConnection.currentTournamentId) return;

    try {
      this.gameService.leaveTournament(userConnection.currentTournamentId, userConnection.userId);
      this.removeSocketFromTournament(socketId, userConnection.currentTournamentId);
      userConnection.currentTournamentId = undefined;

      this.sendMessage(userConnection.socket, {
        type: WSServerMessageType.LEAVE_TOURNAMENT,
        payload: { message: 'Left tournament', timestamp: Date.now() }
      });
    } catch (error: any) {
      console.error('[LEAVE_TOURNAMENT] Error:', error);
    }
  }

  private handleJoinTournamentQueue(socketId: string, payload: any): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection || !userConnection.userId) {
      this.sendError(userConnection?.socket as any, 'User ID required');
      return;
    }

    const { size } = payload;
    if (size !== 4 && size !== 8) {
      this.sendError(userConnection.socket, 'Invalid tournament size');
      return;
    }

    const { success, waiting } = this.gameService.joinTournamentQueue(userConnection.userId, size);

    if (success) {
      this.sendMessage(userConnection.socket, {
        type: WSServerMessageType.TOURNAMENT_QUEUE_JOINED,
        payload: {
          size,
          waitingCount: waiting,
          neededCount: size
        }
      });
    }
  }

  private handleLeaveTournamentQueue(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection || !userConnection.userId) return;

    this.gameService.leaveTournamentQueue(userConnection.userId);
    this.sendMessage(userConnection.socket, {
      type: WSServerMessageType.TOURNAMENT_QUEUE_LEFT,
      payload: { message: 'Left tournament queue', timestamp: Date.now() }
    });
  }

  private addSocketToTournament(socketId: string, tournamentId: string): void {
    if (!this.tournamentSockets.has(tournamentId)) {
      this.tournamentSockets.set(tournamentId, new Set());
    }
    this.tournamentSockets.get(tournamentId)!.add(socketId);
  }

  private removeSocketFromTournament(socketId: string, tournamentId: string): void {
    const set = this.tournamentSockets.get(tournamentId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.tournamentSockets.delete(tournamentId);
      }
    }
  }

  private broadcastToTournament(tournamentId: string, message: WSMessage): void {
    const socketIds = this.tournamentSockets.get(tournamentId);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      const conn = this.userSockets.get(socketId);
      if (conn) {
        this.sendMessage(conn.socket, message);
      }
    }
  }

  private handlePlayerInput(socketId: string, payload: PlayerInputPayload): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { currentRoomId, userId } = userConnection;
    if (!currentRoomId) {
      console.log(`[INPUT_FAIL] Socket ${socketId} (User: ${userId}) not in any room`);
      this.sendError(userConnection.socket, 'Not in any game room');
      return;
    }

    const room = this.gameService.getRoom(currentRoomId);
    if (!room) {
      console.log(`[INPUT_FAIL] Room ${currentRoomId} not found for Socket ${socketId}`);
      this.sendError(userConnection.socket, 'Room not found');
      return;
    }

    try {
      let playerPosition: PlayerPosition | null = null;

      if (room.mode === 'local') {
        if (!payload.playerPosition) {
          this.sendError(userConnection.socket, 'Player position required for local mode');
          return;
        }
        playerPosition = payload.playerPosition;
      } else {
        if (!userId) {
          console.log(`[INPUT_FAIL] User ID missing for socket ${socketId} in online mode`);
          this.sendError(userConnection.socket, 'User ID required for online mode');
          return;
        }
        playerPosition = this.gameService.getUserPosition(currentRoomId, userId);
        if (!playerPosition) {
          console.log(`[INPUT_FAIL] User ${userId} not found as player in Room ${currentRoomId}`);
          this.sendError(userConnection.socket, 'You are not a player in this game');
          return;
        }
      }

      this.gameService.handlePlayerInput(currentRoomId, playerPosition, payload.action);
    } catch (error: any) {
      console.error(`[INPUT_ERROR] ${error.message}`);
      this.sendError(userConnection.socket, error.message || 'Failed to process input');
    }
  }

  private handleLeaveRoom(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { currentRoomId, userId } = userConnection;
    if (!currentRoomId) {
      this.sendError(userConnection.socket, 'Not in any game room');
      return;
    }

    const room = this.gameService.getRoom(currentRoomId);
    if (!room) {
      this.removeSocketFromRoom(socketId, currentRoomId);
      return;
    }

    // For matchmaking/tournament games, end the game and declare opponent as winner
    if ((room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT) && userId) {
      const state = room.getState();
      const playerPosition = this.gameService.getUserPosition(currentRoomId, userId);

      if (playerPosition) {
        const opponentPosition = playerPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;

        // Notify opponent that player disconnected
        const roomSocketSet = this.roomSockets.get(currentRoomId);
        if (roomSocketSet) {
          for (const sid of roomSocketSet) {
            if (sid !== socketId) {
              const conn = this.userSockets.get(sid);
              if (conn) {
                this.sendMessage<PlayerDisconnectedPayload>(conn.socket, {
                  type: WSServerMessageType.PLAYER_DISCONNECTED,
                  payload: {
                    userId,
                    playerPosition,
                    timestamp: Date.now(),
                  },
                });
              }
            }
          }
        }

        // End game with opponent as winner
        room.stop();
        const gameOverData: GameOverData = {
          roomId: currentRoomId,
          winner: opponentPosition,
          winnerId: state.players[opponentPosition].id,
          loserId: state.players[playerPosition].id,
          finalScore: {
            left: state.players.left.score,
            right: state.players.right.score,
          },
          timestamp: Date.now(),
        };

        // Save to database
        this.dbService.saveGameResult(gameOverData, room.mode);

        this.broadcastToRoom(currentRoomId, {
          type: WSServerMessageType.GAME_OVER,
          payload: gameOverData,
        });

        setTimeout(() => {
          this.gameService.deleteRoom(currentRoomId);
          this.roomSockets.delete(currentRoomId);
        }, 5000);
      }
    } else {
      // Local
      room.stop();
      this.gameService.deleteRoom(currentRoomId);
      this.roomSockets.delete(currentRoomId);
    }

    this.removeSocketFromRoom(socketId, currentRoomId);

    this.sendMessage(userConnection.socket, {
      type: WSServerMessageType.ROOM_LEFT,
      payload: {
        roomId: currentRoomId,
        timestamp: Date.now(),
      },
    });
  }

  private setupRoomListeners(room: any): void {
    console.log(`[ROOM_LISTENERS] Setting up listeners for room: ${room.roomId}`);

    room.on('gameStarted', (state: any) => {
      console.log(`[GAME_STARTED] Room: ${room.roomId}, status: ${state.status}`);
      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_STATE,
        payload: state,
      });
    });

    room.on('stateUpdate', (update: GameStateUpdate) => {
      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.STATE_UPDATE,
        payload: update,
      });
    });

    room.on('gameOver', (data: GameOverData) => {
      // Save to database (only matchmaking/tournament games)
      this.dbService.saveGameResult(data, room.mode);

      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_OVER,
        payload: data,
      });

      // Kick everyone from the room immediately
      const socketIds = this.roomSockets.get(room.roomId);
      if (socketIds) {
        console.log(`[GAME_OVER] Cleaning up ${socketIds.size} sockets from room ${room.roomId}`);
        // Create a copy to iterate safely
        const toRemove = Array.from(socketIds);
        for (const socketId of toRemove) {
          this.removeSocketFromRoom(socketId, room.roomId);
        }
      } else {
        console.log(`[GAME_OVER] No sockets found in room ${room.roomId} to cleanup?`);
      }

      setTimeout(() => {
        this.gameService.deleteRoom(room.roomId);
        this.roomSockets.delete(room.roomId);
      }, 1000); // Reduce timeout to 1s
    });
  }

  private addSocketToRoom(socketId: string, roomId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (userConnection) {
      userConnection.currentRoomId = roomId;
      console.log(`[ROOM_ADD] Socket ${socketId} added to room ${roomId}`);
    }

    if (!this.roomSockets.has(roomId)) {
      this.roomSockets.set(roomId, new Set());
    }
    this.roomSockets.get(roomId)!.add(socketId);
  }

  private removeSocketFromRoom(socketId: string, roomId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (userConnection) {
      if (userConnection.currentRoomId === roomId) {
        userConnection.currentRoomId = undefined;
        console.log(`[ROOM_REMOVE] Socket ${socketId} removed from room ${roomId} (cleared currentRoomId)`);
      } else {
        console.log(`[ROOM_REMOVE] Socket ${socketId} removed from room ${roomId} (currentRoomId was ${userConnection.currentRoomId}, NOT cleared)`);
      }
    }

    const roomSocketSet = this.roomSockets.get(roomId);
    if (roomSocketSet) {
      roomSocketSet.delete(socketId);
      if (roomSocketSet.size === 0) {
        this.roomSockets.delete(roomId);
      }
    }
  }

  private handleDisconnect(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { currentRoomId, userId } = userConnection;

    // Handle matchmaking/tournament game disconnection
    if (currentRoomId && userId) {
      const room = this.gameService.getRoom(currentRoomId);
      if (room && (room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT)) {
        const playerPosition = this.gameService.getUserPosition(currentRoomId, userId);

        if (playerPosition) {
          console.log(`[DISCONNECT] User ${userId} disconnected from ${room.mode} game ${currentRoomId}. FORFEIT.`);

          // Immediate Forfeit
          const state = room.getState();
          const opponentPosition = playerPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;

          const gameOverData: GameOverData = {
            roomId: currentRoomId,
            winner: opponentPosition,
            winnerId: state.players[opponentPosition].id,
            loserId: state.players[playerPosition].id,
            finalScore: {
              left: state.players.left.score,
              right: state.players.right.score,
            },
            timestamp: Date.now(),
          };

          // CRITICAL: Emit 'gameOver' on the room so that:
          // 1. Tournament listener picks it up and advances bracket
          // 2. Controller listener (setupRoomListeners) picks it up, saves to DB, broadcasts to room, and cleans up
          room.emit('gameOver', gameOverData);
          room.stop();

        }
      } else if (room) {
        // For local games, just stop immediately
        room.stop();
        this.gameService.deleteRoom(currentRoomId);
        this.roomSockets.delete(currentRoomId);
      }
    }

    // Clean up connection
    this.userSockets.delete(socketId);
    if (userId) {
      // Remove from map if this was the active socket
      if (this.userIdToSocketId.get(userId) === socketId) {
        this.userIdToSocketId.delete(userId);
      }
      // Leave queues
      this.gameService.leaveMatchmaking(userId);
      this.gameService.leaveTournamentQueue(userId);

      // If in tournament but not in game, mark as disconnected in tournament
      if (userConnection.currentTournamentId) {
        const t = this.gameService.getTournament(userConnection.currentTournamentId);
        if (t) t.removePlayer(userId);
      }
    }
  }



  private broadcastToRoom(roomId: string, message: WSMessage): void {
    const socketIds = this.roomSockets.get(roomId);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      const userConnection = this.userSockets.get(socketId);
      if (userConnection) {
        this.sendMessage(userConnection.socket, message);
      }
    }
  }

  private sendMessage<T = any>(socket: WebSocket, message: WSMessage<T>): void {
    if (socket.readyState === socket.OPEN) {
      // Only log non-STATE_UPDATE messages to avoid spam
      if (message.type !== WSServerMessageType.STATE_UPDATE) {
        console.log(`[SEND] type: ${message.type}`);
      }
      socket.send(JSON.stringify(message));
    } else {
      console.log(`[SEND] FAILED - socket not open, type: ${message.type}`);
    }
  }

  private sendError(socket: WebSocket, message: string): void {
    this.sendMessage<ErrorPayload>(socket, {
      type: WSServerMessageType.ERROR,
      payload: { message },
    });
  }
}
