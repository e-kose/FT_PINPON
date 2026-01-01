/**
 * WebSocket Controller
 * Handles persistent WebSocket connections and message routing
 * One connection per user, games are rooms that sockets join/leave dynamically
 */

import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { GameService } from '../service/game.service.js';
import {
  WSClientMessageType,
  WSServerMessageType,
  PlayerPosition,
  type WSMessage,
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
} from '../types/game.types.js';

interface UserConnection {
  socket: WebSocket;
  userId?: string | undefined;
  currentRoomId?: string | undefined;
  connectedAt: number;
}

export class GameWebSocketController {
  private gameService: GameService;
  private userSockets: Map<string, UserConnection> = new Map();
  private userIdToSocketId: Map<string, string> = new Map();
  private roomSockets: Map<string, Set<string>> = new Map();
  private socketIdCounter = 0;

  constructor(gameService: GameService) {
    this.gameService = gameService;
    this.setupMatchmakingListeners();
  }

  private setupMatchmakingListeners(): void {
    this.gameService.getRoomManager().on('matchFound', (data: any) => {
      const { roomId, player1, player2 } = data;

      const socket1Id = this.userIdToSocketId.get(player1);
      const socket2Id = this.userIdToSocketId.get(player2);

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

  private handleCreateLocalGame(socketId: string, payload?: CreateLocalGamePayload): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const userId = userConnection.userId || `guest-${socketId}`;

    try {
      const { roomId, room } = this.gameService.createLocalGame(userId, payload?.config);

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
      room.start();
    } catch (error: any) {
      this.sendError(userConnection.socket, error.message || 'Failed to create local game');
    }
  }

  private handleJoinMatchmaking(socketId: string): void {
    const userConnection = this.userSockets.get(socketId);
    if (!userConnection) return;

    const { userId } = userConnection;
    if (!userId) {
      this.sendError(userConnection.socket, 'User ID required for matchmaking');
      return;
    }

    try {
      this.gameService.joinMatchmaking(userId);

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

    const { currentRoomId } = userConnection;
    if (!currentRoomId) {
      this.sendError(userConnection.socket, 'Not in any game room');
      return;
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
    room.on('gameStarted', (state: any) => {
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

    if (userConnection.currentRoomId) {
      this.removeSocketFromRoom(socketId, userConnection.currentRoomId);
    }

    if (userConnection.userId) {
      this.userIdToSocketId.delete(userConnection.userId);
      this.gameService.leaveMatchmaking(userConnection.userId);
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
      socket.send(JSON.stringify(message));
    }
  }

  private sendError(socket: WebSocket, message: string, code?: string): void {
    this.sendMessage<ErrorPayload>(socket, {
      type: WSServerMessageType.ERROR,
      payload: { message, code },
    });
  }
}
