import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { GameService } from '../service/game.service.js';
import { DatabaseService } from '../../plugins/db.service.js';
import { SocketRegistry } from '../socket/socket.registry.js';
import {
  WSClientMessageType,
  WSServerMessageType,
  PlayerPosition,
  type WSMessage,
  type GameStateUpdate,
  type GameOverData,
  type PlayerDisconnectedPayload,
  type MatchFoundPayload,
  type ConnectedPayload
} from '../types/game.types.js';
import { ConnectionHandler } from '../handlers/connection.handler.js';
import { RoomHandler } from '../handlers/room.handler.js';
import { MatchmakingHandler } from '../handlers/matchmaking.handler.js';
import { TournamentHandler } from '../handlers/tournament.handler.js';
import { GameRoom } from '../engine/game.room.js';
import { GameMode } from '../types/game.types.js';

export class GameWebSocketController {
  private gameService: GameService;
  private dbService: DatabaseService;
  private socketRegistry: SocketRegistry;

  private connectionHandler: ConnectionHandler;
  private roomHandler: RoomHandler;
  private matchmakingHandler: MatchmakingHandler;
  private tournamentHandler: TournamentHandler;

  constructor(gameService: GameService, dbService: DatabaseService) {
    this.gameService = gameService;
    this.dbService = dbService;
    this.socketRegistry = new SocketRegistry();

    this.connectionHandler = new ConnectionHandler(gameService, this.socketRegistry, dbService);
    this.roomHandler = new RoomHandler(gameService, this.socketRegistry, dbService);
    this.matchmakingHandler = new MatchmakingHandler(gameService, this.socketRegistry, dbService);
    this.tournamentHandler = new TournamentHandler(gameService, this.socketRegistry, dbService);

    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    // specialized listeners for matchmaking and tournament
    this.setupMatchmakingListeners();
    this.setupTournamentListeners();
  }

  private setupMatchmakingListeners(): void {
    this.gameService.getRoomManager().on('matchFound', (data: any) => {
      const { roomId, player1, player2 } = data;
      console.log(`[MATCH_FOUND] roomId: ${roomId}, player1: ${player1}, player2: ${player2}`);

      const conn1 = this.socketRegistry.getConnectionByUserId(player1);
      const conn2 = this.socketRegistry.getConnectionByUserId(player2);

      const startGame = (c1SocketId: string, c2SocketId: string) => {
        this.socketRegistry.addToRoom(c1SocketId, roomId);
        this.socketRegistry.addToRoom(c2SocketId, roomId);

        const conn1 = this.socketRegistry.getConnection(c1SocketId);
        const conn2 = this.socketRegistry.getConnection(c2SocketId);

        if (conn1) {
          this.sendMessage(conn1.socket, {
            type: WSServerMessageType.MATCH_FOUND,
            payload: {
              roomId,
              opponentId: player2,
              playerPosition: PlayerPosition.LEFT,
              timestamp: Date.now(),
            },
          });
        }

        if (conn2) {
          this.sendMessage(conn2.socket, {
            type: WSServerMessageType.MATCH_FOUND,
            payload: {
              roomId,
              opponentId: player1,
              playerPosition: PlayerPosition.RIGHT,
              timestamp: Date.now(),
            },
          });
        }

        const room = this.gameService.getRoom(roomId);
        if (room) {
          this.setupRoomListeners(room);
          room.start();
        }
      };

      if (conn1 && conn2) {
        startGame(conn1.socketId, conn2.socketId);
      }
    });
  }

  private setupTournamentListeners(): void {
    const tm = this.gameService.getTournamentManager();

    tm.on('tournamentUpdate', (event: any) => {
      const { tournamentId, data } = event;
      this.broadcastToTournament(tournamentId, {
        type: WSServerMessageType.TOURNAMENT_STATE,
        payload: data
      });
    });

    tm.on('tournamentMatchStarted', (event: any) => {
      const { tournamentId, roomId, player1Id, player2Id } = event;

      console.log(`[TOURNAMENT] Match started in ${tournamentId}: ${player1Id} vs ${player2Id} (Room: ${roomId})`);

      const conn1 = this.socketRegistry.getConnectionByUserId(player1Id);
      const conn2 = this.socketRegistry.getConnectionByUserId(player2Id);

      const joinPlayer = (conn: any, opponentId: string, position: PlayerPosition) => {
        if (conn) {
          this.socketRegistry.addToRoom(conn.socketId, roomId);
          this.sendMessage(conn.socket, {
            type: WSServerMessageType.MATCH_FOUND,
            payload: { roomId, opponentId, playerPosition: position, timestamp: Date.now() }
          });
        }
      };

      joinPlayer(conn1, player2Id, PlayerPosition.LEFT);
      joinPlayer(conn2, player1Id, PlayerPosition.RIGHT);

      const room = this.gameService.getRoom(roomId);
      if (room) { this.setupRoomListeners(room); room.start(); }
    });

    tm.on('tournamentStarted', (event: any) => {
      const { tournamentId, players } = event;
      console.log(`[TOURNAMENT_STARTED] Auto-started ${tournamentId}`);

      players.forEach((userId: string) => {
        const conn = this.socketRegistry.getConnectionByUserId(userId);
        if (conn) {
          this.socketRegistry.addToTournament(conn.socketId, tournamentId);

          this.sendMessage(conn.socket, {
            type: WSServerMessageType.TOURNAMENT_CREATED,
            payload: { tournamentId, timestamp: Date.now() }
          });

          const t = this.gameService.getTournament(tournamentId);
          if (t) {
            this.sendMessage(conn.socket, {
              type: WSServerMessageType.TOURNAMENT_STATE,
              payload: { tournament: t.getData() }
            });
          }
        }
      });
    });
  }

  public async handleConnection(socket: WebSocket, request: FastifyRequest): Promise<void> {
    const userId = request.headers['x-user-id'] as string | undefined;
    const socketId = this.socketRegistry.generateSocketId();

    // Check if user is already connected with old socket (reconnect logic handled in ConnectionHandler potentially,
    // but here we just register).
    // The previous implementation closed old connections on new connection with same UserID.
    if (userId) {
      const oldConn = this.socketRegistry.getConnectionByUserId(userId);
      if (oldConn) {
        this.sendError(oldConn.socket, 'New connection established');
        // Explicitly cleanup the old connection state (remove from rooms, tournaments, etc.)
        this.cleanupConnection(oldConn.socketId);
        oldConn.socket.close();
      }

      // Check for active tournament
      const tournament = this.gameService.getTournamentByPlayer(userId);
      if (tournament) {
        // Will be added in addConnection if we passed logic? No, registry is dumb.
        // We do it here.
      }
    }

    const connection = this.socketRegistry.addConnection(socket, socketId, userId);

    if (userId) {
      const tournament = this.gameService.getTournamentByPlayer(userId);
      if (tournament) {
        this.socketRegistry.addToTournament(socketId, tournament.id);
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

  private handleMessage(socketId: string, data: Buffer, request: FastifyRequest): void {
    const userConnection = this.socketRegistry.getConnection(socketId);
    if (!userConnection) return;

    try {
      const message: WSMessage = JSON.parse(data.toString());
      request.log.debug({ socketId, type: message.type }, 'Message received');

      switch (message.type) {
        case WSClientMessageType.SET_USER_ID:
          this.connectionHandler.handleSetUserId(socketId, userConnection.socket, message.payload);
          break;

        case WSClientMessageType.CREATE_LOCAL_GAME:
          const room = this.roomHandler.handleCreateLocalGame(socketId, userConnection.socket, message.payload);
          if (room) {
            this.setupRoomListeners(room);
          }
          break;

        case WSClientMessageType.JOIN_MATCHMAKING:
          this.matchmakingHandler.handleJoinMatchmaking(socketId, userConnection.socket);
          break;

        case WSClientMessageType.LEAVE_MATCHMAKING:
          this.matchmakingHandler.handleLeaveMatchmaking(socketId, userConnection.socket);
          break;

        // Tournament
        case WSClientMessageType.JOIN_TOURNAMENT_QUEUE:
          this.tournamentHandler.handleJoinQueue(socketId, userConnection.socket, message.payload);
          break;

        case WSClientMessageType.LEAVE_TOURNAMENT_QUEUE:
          this.tournamentHandler.handleLeaveQueue(socketId, userConnection.socket);
          break;

        case WSClientMessageType.LEAVE_TOURNAMENT:
          this.tournamentHandler.handleLeaveTournament(socketId, userConnection.socket);
          break;

        // Game Room
        case WSClientMessageType.PLAYER_INPUT:
          this.roomHandler.handlePlayerInput(socketId, userConnection.socket, message.payload);
          break;

        case WSClientMessageType.LEAVE_ROOM:
          this.roomHandler.handleLeaveRoom(socketId, userConnection.socket);
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

  private handleDisconnect(socketId: string): void {
    this.cleanupConnection(socketId);
  }

  /**
   * Centralized cleanup logic for a connection.
   * Removes user from rooms, matchmaking, tournaments, and the registry.
   */
  private cleanupConnection(socketId: string): void {
    const userConnection = this.socketRegistry.getConnection(socketId);
    if (!userConnection) return;

    const { currentRoomId, userId } = userConnection;

    if (currentRoomId && userId) {
      const room = this.gameService.getRoom(currentRoomId);
      if (room) {
        if (room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT) {
          // Clean forfeit logic via Room
          room.handlePlayerDisconnect(userId);
        } else {
          // Local
          room.stop();
          this.gameService.deleteRoom(currentRoomId);
        }
      }
    }

    if (userId) {
      this.gameService.leaveMatchmaking(userId);
      this.gameService.leaveTournamentQueue(userId);

      if (userConnection.currentTournamentId) {
        const t = this.gameService.getTournament(userConnection.currentTournamentId);
        if (t) t.removePlayer(userId);
      }
    }

    this.socketRegistry.removeConnection(socketId);
  }

  private setupRoomListeners(room: GameRoom): void {
    console.log(`[ROOM_LISTENERS] Setting up listeners for room: ${room.roomId}`);

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

    room.on('playerDisconnected', (data: any) => {
      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.PLAYER_DISCONNECTED,
        payload: data
      });
    });

    room.on('gameOver', (data: GameOverData) => {
      // Save to database
      this.gameService.processGameResult(data, room.mode);

      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_OVER,
        payload: data,
      });

      // Cleanup room members
      const socketIds = this.socketRegistry.getRoomSockets(room.roomId);
      for (const socketId of socketIds) {
        this.socketRegistry.removeSocketFromRoom(socketId, room.roomId);
      }

      setTimeout(() => {
        this.gameService.deleteRoom(room.roomId);
        // Registry already cleaned up above for users.
      }, 1000);
    });
  }

  private broadcastToRoom(roomId: string, message: WSMessage): void {
    const socketIds = this.socketRegistry.getRoomSockets(roomId);
    for (const sid of socketIds) {
      const conn = this.socketRegistry.getConnection(sid);
      if (conn) {
        this.sendMessage(conn.socket, message);
      }
    }
  }

  private broadcastToTournament(tournamentId: string, message: WSMessage): void {
    const socketIds = this.socketRegistry.getTournamentSockets(tournamentId);
    for (const sid of socketIds) {
      const conn = this.socketRegistry.getConnection(sid);
      if (conn) {
        this.sendMessage(conn.socket, message);
      }
    }
  }

  private sendMessage<T = any>(socket: WebSocket, message: any): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private sendError(socket: WebSocket, message: string): void {
    this.sendMessage(socket, { type: WSServerMessageType.ERROR, payload: { message } });
  }
}
