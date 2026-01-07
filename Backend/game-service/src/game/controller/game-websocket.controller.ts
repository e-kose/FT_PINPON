import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { SocketRegistry } from '../socket/socket.registry.js';
import { RoomManager } from '../engine/room.manager.js';
import { TournamentManager } from '../engine/tournament.manager.js';
import {
  WSClientMessageType,
  WSServerMessageType,
  PlayerPosition,
  type WSMessage,
  type GameStateUpdate,
  type GameOverData,
  type ConnectedPayload
} from '../types/game.types.js';
import { RoomHandler } from '../handlers/room.handler.js';
import { MatchmakingHandler } from '../handlers/matchmaking.handler.js';
import { TournamentHandler } from '../handlers/tournament.handler.js';
import { GameRoom } from '../engine/game.room.js';
import { GameMode } from '../types/game.types.js';
import { GameRepository } from '../repository/game.repository.js';

export class GameWebSocketController {
  private roomManager: RoomManager;
  private tournamentManager: TournamentManager;
  private socketRegistry: SocketRegistry;
  private gameRepository: GameRepository;

  private roomHandler: RoomHandler;
  private matchmakingHandler: MatchmakingHandler;
  private tournamentHandler: TournamentHandler;

  constructor(roomManager: RoomManager, tournamentManager: TournamentManager, gameRepository: GameRepository) {
    this.roomManager = roomManager;
    this.tournamentManager = tournamentManager;
    this.gameRepository = gameRepository;
    this.socketRegistry = new SocketRegistry();

    this.roomHandler = new RoomHandler(roomManager, this.socketRegistry);
    this.matchmakingHandler = new MatchmakingHandler(roomManager, this.socketRegistry);
    this.tournamentHandler = new TournamentHandler(tournamentManager, this.socketRegistry);

    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    this.setupMatchmakingListeners();
    this.setupTournamentListeners();
  }

  private setupMatchmakingListeners(): void {
    this.roomManager.on('matchFound', (data: any) => {
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

        const room = this.roomManager.getRoom(roomId);
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
    const tm = this.tournamentManager;

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

      const joinPlayer = (conn: any, opponentId: string, opponentUsername: string | undefined, position: PlayerPosition) => {
        if (conn) {
          this.socketRegistry.addToRoom(conn.socketId, roomId);
          this.sendMessage(conn.socket, {
            type: WSServerMessageType.MATCH_FOUND,
            payload: { roomId, opponentId, opponentUsername, playerPosition: position, timestamp: Date.now() }
          });
        }
      };

      joinPlayer(conn1, player2Id, conn2?.username, PlayerPosition.LEFT);
      joinPlayer(conn2, player1Id, conn1?.username, PlayerPosition.RIGHT);

      const room = this.roomManager.getRoom(roomId);
      if (room) { this.setupRoomListeners(room); room.start(); }
    });

    tm.on('tournamentFinished', (event: any) => {
      const { tournamentId, tournamentData } = event;

      const winnerId = tournamentData.bracket.winnerId;
      const winnerPlayer = tournamentData.players.find((p: any) => p.id === winnerId);

      if (!winnerId || !winnerPlayer) {
        console.error('[TOURNAMENT_FINISHED] No winner found');
        return;
      }

      try {
        this.gameRepository.saveTournament({
          id: tournamentId,
          size: tournamentData.size,
          winnerId: winnerId,
          winnerUsername: winnerPlayer.username,
          participants: tournamentData.players.map((p: any) => ({
            id: p.id,
            username: p.username
          }))
        });

        tournamentData.bracket.rounds.forEach((round: any, roundIndex: number) => {
          round.matches.forEach((match: any) => {
            if (match.status === 'finished' && match.player1Id && match.player2Id) {
              this.gameRepository.saveTournamentMatch({
                tournamentId: tournamentId,
                round: roundIndex,
                player1Id: match.player1Id,
                player1Username: match.player1Username || 'Unknown',
                player1Score: match.player1Score ?? 0,
                player2Id: match.player2Id,
                player2Username: match.player2Username || 'Unknown',
                player2Score: match.player2Score ?? 0,
                winnerId: match.winnerId,
              });
            }
          });
        });
      } catch (err) {
        console.error('[TOURNAMENT_FINISHED] Failed to save tournament:', err);
      }
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

          const t = this.tournamentManager.getTournament(tournamentId);
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
    const username = request.headers['x-user-username'] as string;
    if (!username) {
      this.sendError(socket, 'Username header (x-user-username) required');
      socket.close();
      return;
    }
    console.log("New WebSocket connection. userId:", userId, "username:", username);
    console.log("Headers:", request.headers);
    const socketId = this.socketRegistry.generateSocketId();

    if (userId) {
      const oldConn = this.socketRegistry.getConnectionByUserId(userId);
      if (oldConn) {
        this.sendError(oldConn.socket, 'New connection established');
        this.cleanupConnection(oldConn.socketId);
        oldConn.socket.close();
      }
    }

    const connection = this.socketRegistry.addConnection(socket, socketId, userId, username);

    if (userId) {
      const tournament = this.tournamentManager.getTournamentByPlayer(userId);
      if (tournament) {
        this.socketRegistry.addToTournament(socketId, tournament.id);
        this.sendMessage(socket, {
          type: WSServerMessageType.TOURNAMENT_STATE,
          payload: { tournament: tournament.getData() }
        });
      }
    }

    this.sendMessage(socket, {
      type: WSServerMessageType.CONNECTED,
      payload: {
        socketId,
        userId,
        username,
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

        case WSClientMessageType.JOIN_TOURNAMENT_QUEUE:
          this.tournamentHandler.handleJoinQueue(socketId, userConnection.socket, message.payload);
          break;

        case WSClientMessageType.LEAVE_TOURNAMENT_QUEUE:
          this.tournamentHandler.handleLeaveQueue(socketId, userConnection.socket);
          break;

        case WSClientMessageType.LEAVE_TOURNAMENT:
          this.tournamentHandler.handleLeaveTournament(socketId, userConnection.socket);
          break;

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
      const room = this.roomManager.getRoom(currentRoomId);
      if (room) {
        if (room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT) {
          room.handlePlayerDisconnect(userId);
        } else {
          room.stop();
          this.roomManager.deleteRoom(currentRoomId);
        }
      }
    }

    if (userId) {
      this.roomManager.removeFromMatchmakingQueue(userId);
      this.tournamentManager.leaveQueue(userId);

      if (userConnection.currentTournamentId) {
        const t = this.tournamentManager.getTournament(userConnection.currentTournamentId);
        if (t) t.removePlayer(userId);
      }
    }

    this.socketRegistry.removeConnection(socketId);
  }

  private setupRoomListeners(room: GameRoom): void {
    console.log(`[ROOM_LISTENERS] Setting up listeners for room: ${room.roomId}`);

    room.on('gameStarted', (state: any) => {
      const leftConn = this.socketRegistry.getConnectionByUserId(state.players.left.id);
      const rightConn = this.socketRegistry.getConnectionByUserId(state.players.right.id);

      const enhancedState = {
        ...state,
        players: {
          left: {
            ...state.players.left,
            username: leftConn?.username
          },
          right: {
            ...state.players.right,
            username: rightConn?.username
          }
        }
      };

      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_STATE,
        payload: enhancedState,
      });
    });

    room.on('stateUpdate', (update: GameStateUpdate) => {
      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.STATE_UPDATE,
        payload: update,
      });
    });

    room.on('playerDisconnected', (data: any) => {
      const { userId } = data;
      const conn = this.socketRegistry.getConnectionByUserId(userId);
      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.PLAYER_DISCONNECTED,
        payload: {
          ...data,
          username: conn?.username
        }
      });
    });

    room.on('gameOver', (data: GameOverData) => {
      const winnerConn = this.socketRegistry.getConnectionByUserId(data.winnerId);
      const loserConn = this.socketRegistry.getConnectionByUserId(data.loserId);

      this.broadcastToRoom(room.roomId, {
        type: WSServerMessageType.GAME_OVER,
        payload: {
          ...data,
          winnerUsername: winnerConn?.username || 'Unknown',
          loserUsername: loserConn?.username || 'Unknown'
        },
      });

      if (room.mode === GameMode.MATCHMAKING) {
        const leftPlayer = room.getPlayerByPosition(PlayerPosition.LEFT);
        const rightPlayer = room.getPlayerByPosition(PlayerPosition.RIGHT);

        if (leftPlayer && rightPlayer) {
          const leftConn = this.socketRegistry.getConnectionByUserId(leftPlayer.id);
          const rightConn = this.socketRegistry.getConnectionByUserId(rightPlayer.id);

          try {
            this.gameRepository.saveMatchmakingMatch({
              player1Id: leftPlayer.id,
              player1Username: leftConn?.username || 'Unknown',
              player1Score: leftPlayer.score,
              player2Id: rightPlayer.id,
              player2Username: rightConn?.username || 'Unknown',
              player2Score: rightPlayer.score,
              winnerId: data.winnerId,
            });
            console.log(`[GameOver] Matchmaking match saved for room ${room.roomId}`);
          } catch (err) {
            console.error('[GameOver] Failed to save matchmaking match:', err);
          }
        }
      }

      if (room.mode === GameMode.TOURNAMENT && room.tournamentId && room.round !== undefined) {
        const leftPlayer = room.getPlayerByPosition(PlayerPosition.LEFT);
        const rightPlayer = room.getPlayerByPosition(PlayerPosition.RIGHT);

        if (leftPlayer && rightPlayer) {
          const leftConn = this.socketRegistry.getConnectionByUserId(leftPlayer.id);
          const rightConn = this.socketRegistry.getConnectionByUserId(rightPlayer.id);

          try {
            this.gameRepository.saveTournamentMatch({
              tournamentId: room.tournamentId,
              round: room.round,
              player1Id: leftPlayer.id,
              player1Username: leftConn?.username || 'Unknown',
              player1Score: leftPlayer.score,
              player2Id: rightPlayer.id,
              player2Username: rightConn?.username || 'Unknown',
              player2Score: rightPlayer.score,
              winnerId: data.winnerId,
            });
          } catch (err) {
            console.error('[GameOver] Failed to save tournament match:', err);
          }
        }
      }

      const socketIds = this.socketRegistry.getRoomSockets(room.roomId);
      for (const socketId of socketIds) {
        this.socketRegistry.removeSocketFromRoom(socketId, room.roomId);
      }

      setTimeout(() => {
        this.roomManager.deleteRoom(room.roomId);
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
