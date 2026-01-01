/**
 * WebSocket Controller
 * Handles persistent WebSocket connections and message routing
 * One connection per user, games are rooms that sockets join/leave dynamically
 */

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
} from '../types/game.types.js';

const RECONNECT_TIMEOUT_MS = 30000; // 30 seconds

interface DisconnectedPlayer {
  roomId: string;
  playerPosition: PlayerPosition;
  timeout: NodeJS.Timeout;
}

interface UserConnection {
  socket: WebSocket;
  userId?: string | undefined;
  currentRoomId?: string | undefined;
  connectedAt: number;
}

export class GameWebSocketController {
  private gameService: GameService;
  private dbService: DatabaseService;
  private userSockets: Map<string, UserConnection> = new Map();
  private userIdToSocketId: Map<string, string> = new Map();
  private roomSockets: Map<string, Set<string>> = new Map();
  private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();
  private socketIdCounter = 0;

  constructor(gameService: GameService, dbService: DatabaseService) {
    this.gameService = gameService;
    this.dbService = dbService;
    this.setupMatchmakingListeners();
  }

  private setupMatchmakingListeners(): void {
    this.gameService.getRoomManager().on('matchFound', (data: any) => {
      const { roomId, player1, player2 } = data;
      console.log(`[MATCH_FOUND] roomId: ${roomId}, player1: ${player1}, player2: ${player2}`);

      const socket1Id = this.userIdToSocketId.get(player1);
      const socket2Id = this.userIdToSocketId.get(player2);
      console.log(`[MATCH_FOUND] socket1Id: ${socket1Id}, socket2Id: ${socket2Id}`);

      if (socket1Id && socket2Id) {
        const conn1 = this.userSockets.get(socket1Id);
        const conn2 = this.userSockets.get(socket2Id);

        if (conn1 && conn2) {
          this.addSocketToRoom(socket1Id, roomId);
          this.addSocketToRoom(socket2Id, roomId);

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
        }
      }
    });
  }

  public async handleConnection(socket: WebSocket, request: FastifyRequest): Promise<void> {
    const userId = request.headers['x-user-id'] as string | undefined;
    const socketId = this.generateSocketId();

    // Check if user is reconnecting
    if (userId) {
      const disconnectedInfo = this.disconnectedPlayers.get(userId);
      if (disconnectedInfo) {
        console.log(`[RECONNECT] User ${userId} reconnecting to room ${disconnectedInfo.roomId}`);
        clearTimeout(disconnectedInfo.timeout);
        this.disconnectedPlayers.delete(userId);

        const room = this.gameService.getRoom(disconnectedInfo.roomId);
        if (room) {
          room.resume();

          const userConnection: UserConnection = {
            socket,
            userId,
            currentRoomId: disconnectedInfo.roomId,
            connectedAt: Date.now(),
          };

          this.userSockets.set(socketId, userConnection);
          this.userIdToSocketId.set(userId, socketId);
          this.addSocketToRoom(socketId, disconnectedInfo.roomId);

          // Get opponent ID
          const state = room.getState();
          const opponentPosition = disconnectedInfo.playerPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;
          const opponentId = state.players[opponentPosition].id;

          this.sendMessage<PlayerReconnectedPayload>(socket, {
            type: WSServerMessageType.PLAYER_RECONNECTED,
            payload: {
              roomId: disconnectedInfo.roomId,
              mode: room.mode,
              playerPosition: disconnectedInfo.playerPosition,
              opponentId,
              timestamp: Date.now(),
            },
          });

          // Notify opponent
          const roomSocketSet = this.roomSockets.get(disconnectedInfo.roomId);
          if (roomSocketSet) {
            for (const sid of roomSocketSet) {
              if (sid !== socketId) {
                const conn = this.userSockets.get(sid);
                if (conn) {
                  this.sendMessage<PlayerReconnectedPayload>(conn.socket, {
                    type: WSServerMessageType.PLAYER_RECONNECTED,
                    payload: {
                      roomId: disconnectedInfo.roomId,
                      mode: room.mode,
                      playerPosition: disconnectedInfo.playerPosition,
                      opponentId: userId,
                      timestamp: Date.now(),
                    },
                  });
                }
              }
            }
          }

          request.log.info({ socketId, userId, roomId: disconnectedInfo.roomId }, 'Player reconnected');

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

          return;
        }
      }
    }

    const userConnection: UserConnection = {
      socket,
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

  private handleCreateLocalGame(socketId: string, payload?: CreateLocalGamePayload): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const userId = userConnection.userId || `guest-${socketId}`;
    console.log(`[CREATE_LOCAL_GAME] socketId: ${socketId}, userId: ${userId}`);

    try {
      const { roomId, room } = this.gameService.createLocalGame(userId, payload?.config);
      console.log(`[CREATE_LOCAL_GAME] Created room: ${roomId}, mode: ${room.mode}`);

      this.addSocketToRoom(socketId, roomId);

      this.sendMessage<RoomCreatedPayload>(userConnection.socket, {
        type: WSServerMessageType.ROOM_CREATED,
        payload: {
          roomId,
          mode: room.mode,
          timestamp: Date.now(),
        },
      });

      this.sendMessage<PlayerAssignedPayload>(userConnection.socket, {
        type: WSServerMessageType.PLAYER_ASSIGNED,
        payload: {
          playerPosition: PlayerPosition.LEFT,
          userId: `${userId}-p1`,
        },
      });

      this.sendMessage<PlayerAssignedPayload>(userConnection.socket, {
        type: WSServerMessageType.PLAYER_ASSIGNED,
        payload: {
          playerPosition: PlayerPosition.RIGHT,
          userId: `${userId}-p2`,
        },
      });

      this.setupRoomListeners(room);
      console.log(`[ROOM] Starting game loop for room: ${roomId}`);
      room.start();
    } catch (error: any) {
      console.error(`[CREATE_LOCAL_GAME] ERROR:`, error);
      this.sendError(userConnection.socket, error.message || 'Failed to create local game');
    }
  }

  private handleJoinMatchmaking(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { userId } = userConnection;
    console.log(`[JOIN_MATCHMAKING] socketId: ${socketId}, userId: ${userId}`);

    if (!userId) {
      console.log(`[JOIN_MATCHMAKING] ERROR: User ID required for matchmaking`);
      this.sendError(userConnection.socket, 'User ID required for matchmaking');
      return;
    }

    // Check if user has a disconnected game
    const disconnectedInfo = this.disconnectedPlayers.get(userId);
    if (disconnectedInfo) {
      console.log(`[JOIN_MATCHMAKING] User ${userId} reconnecting to room ${disconnectedInfo.roomId}`);
      clearTimeout(disconnectedInfo.timeout);
      this.disconnectedPlayers.delete(userId);

      const room = this.gameService.getRoom(disconnectedInfo.roomId);
      if (room) {
        room.resume();

        userConnection.currentRoomId = disconnectedInfo.roomId;
        this.addSocketToRoom(socketId, disconnectedInfo.roomId);

        // Get opponent ID
        const state = room.getState();
        const opponentPosition = disconnectedInfo.playerPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;
        const opponentId = state.players[opponentPosition].id;

        this.sendMessage<PlayerReconnectedPayload>(userConnection.socket, {
          type: WSServerMessageType.PLAYER_RECONNECTED,
          payload: {
            roomId: disconnectedInfo.roomId,
            mode: room.mode,
            playerPosition: disconnectedInfo.playerPosition,
            opponentId,
            timestamp: Date.now(),
          },
        });

        // Notify opponent
        const roomSocketSet = this.roomSockets.get(disconnectedInfo.roomId);
        if (roomSocketSet) {
          for (const sid of roomSocketSet) {
            if (sid !== socketId) {
              const conn = this.userSockets.get(sid);
              if (conn) {
                this.sendMessage<PlayerReconnectedPayload>(conn.socket, {
                  type: WSServerMessageType.PLAYER_RECONNECTED,
                  payload: {
                    roomId: disconnectedInfo.roomId,
                    mode: room.mode,
                    playerPosition: disconnectedInfo.playerPosition,
                    opponentId: userId,
                    timestamp: Date.now(),
                  },
                });
              }
            }
          }
        }

        return;
      }
    }

    try {
      this.gameService.joinMatchmaking(userId);
      console.log(`[JOIN_MATCHMAKING] User ${userId} added to queue`);

      this.sendMessage<MatchmakingSearchingPayload>(userConnection.socket, {
        type: WSServerMessageType.MATCHMAKING_SEARCHING,
        payload: {
          message: 'Searching for opponent...',
          timestamp: Date.now(),
        },
      });
    } catch (error: any) {
      this.sendError(userConnection.socket, error.message || 'Failed to join matchmaking');
    }
  }

  private handleLeaveMatchmaking(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { userId } = userConnection;
    if (!userId) {
      this.sendError(userConnection.socket, 'User ID required');
      return;
    }

    try {
      this.gameService.leaveMatchmaking(userId);

      this.sendMessage(userConnection.socket, {
        type: WSServerMessageType.ROOM_LEFT,
        payload: {
          message: 'Left matchmaking queue',
          timestamp: Date.now(),
        },
      });
    } catch (error: any) {
      this.sendError(userConnection.socket, error.message || 'Failed to leave matchmaking');
    }
  }

  private handlePlayerInput(socketId: string, payload: PlayerInputPayload): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { currentRoomId, userId } = userConnection;
    if (!currentRoomId) {
      this.sendError(userConnection.socket, 'Not in any game room');
      return;
    }

    const room = this.gameService.getRoom(currentRoomId);
    if (!room) {
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
          this.sendError(userConnection.socket, 'User ID required for online mode');
          return;
        }
        playerPosition = this.gameService.getUserPosition(currentRoomId, userId);
        if (!playerPosition) {
          this.sendError(userConnection.socket, 'You are not a player in this game');
          return;
        }
      }

      this.gameService.handlePlayerInput(currentRoomId, playerPosition, payload.action);
    } catch (error: any) {
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

    // For matchmaking games, end the game and declare opponent as winner
    if (room.mode === GameMode.MATCHMAKING && userId) {
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
      // Save to database (only matchmaking games)
      this.dbService.saveGameResult(data, room.mode);

      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_OVER,
        payload: data,
      });

      setTimeout(() => {
        this.gameService.deleteRoom(room.roomId);
        this.roomSockets.delete(room.roomId);
      }, 5000);
    });
  }

  private addSocketToRoom(socketId: string, roomId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (userConnection) {
      userConnection.currentRoomId = roomId;
    }

    if (!this.roomSockets.has(roomId)) {
      this.roomSockets.set(roomId, new Set());
    }
    this.roomSockets.get(roomId)!.add(socketId);
  }

  private removeSocketFromRoom(socketId: string, roomId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (userConnection) {
      userConnection.currentRoomId = undefined;
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

    // Handle matchmaking game disconnection
    if (currentRoomId && userId) {
      const room = this.gameService.getRoom(currentRoomId);
      if (room && room.mode === GameMode.MATCHMAKING) {
        const playerPosition = this.gameService.getUserPosition(currentRoomId, userId);

        if (playerPosition) {
          console.log(`[DISCONNECT] User ${userId} disconnected from matchmaking game ${currentRoomId}`);

          // Pause the game
          room.pause();

          // Notify opponent
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
                      timeout: RECONNECT_TIMEOUT_MS,
                      timestamp: Date.now(),
                    },
                  });
                }
              }
            }
          }

          // Set timeout to end game if user doesn't reconnect
          const timeout = setTimeout(() => {
            console.log(`[TIMEOUT] User ${userId} did not reconnect in time`);
            this.disconnectedPlayers.delete(userId);

            const room = this.gameService.getRoom(currentRoomId);
            if (room) {
              const state = room.getState();
              const opponentPosition = playerPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;

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
          }, RECONNECT_TIMEOUT_MS);

          this.disconnectedPlayers.set(userId, {
            roomId: currentRoomId,
            playerPosition,
            timeout,
          });
        }
      } else if (room) {
        // For local games, just stop immediately
        room.stop();
        this.gameService.deleteRoom(currentRoomId);
        this.roomSockets.delete(currentRoomId);
      }
    }

    if (currentRoomId) {
      this.removeSocketFromRoom(socketId, currentRoomId);
    }

    if (userId) {
      this.userIdToSocketId.delete(userId);
      this.gameService.leaveMatchmaking(userId);
    }

    this.userSockets.delete(socketId);
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

  private sendError(socket: WebSocket, message: string, code?: string): void {
    this.sendMessage<ErrorPayload>(socket, {
      type: WSServerMessageType.ERROR,
      payload: { message, code },
    });
  }
}
