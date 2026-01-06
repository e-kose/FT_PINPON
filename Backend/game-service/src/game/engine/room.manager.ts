/**
 * Room Manager
 * Manages all game rooms and matchmaking queue
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { GameRoom } from './game.room.js';
import { GameMode, PlayerPosition, type GameConfig } from '../types/game.types.js';

interface MatchmakingRequest {
  userId: string;
  timestamp: number;
  config?: Partial<GameConfig> | undefined;
}

export class RoomManager extends EventEmitter {
  private rooms: Map<string, GameRoom> = new Map();
  private matchmakingQueue: MatchmakingRequest[] = [];

  public createLocalGame(userId: string, config?: Partial<GameConfig>): { roomId: string; room: GameRoom } {
    const roomId = `local-${randomUUID()}`;
    const room = new GameRoom(roomId, GameMode.LOCAL, config);

    room.assignPlayer(PlayerPosition.LEFT, `${userId}-p1`);
    room.assignPlayer(PlayerPosition.RIGHT, `${userId}-p2`);

    this.rooms.set(roomId, room);
    return { roomId, room };
  }

  public createOnlineGame(
    player1Id: string,
    player2Id: string,
    config?: Partial<GameConfig>
  ): { roomId: string; room: GameRoom } {
    const roomId = `match-${randomUUID()}`;
    const room = new GameRoom(roomId, GameMode.MATCHMAKING, config);

    room.assignPlayer(PlayerPosition.LEFT, player1Id);
    room.assignPlayer(PlayerPosition.RIGHT, player2Id);

    this.rooms.set(roomId, room);
    return { roomId, room };
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.cleanup();
      this.rooms.delete(roomId);
    }
  }

  public addToMatchmakingQueue(userId: string, config?: Partial<GameConfig>): void {
    if (this.matchmakingQueue.some((req) => req.userId === userId)) {
      return;
    }

    this.matchmakingQueue.push({ userId, timestamp: Date.now(), config });
    this.tryMatchPlayers();
  }

  public removeFromMatchmakingQueue(userId: string): void {
    this.matchmakingQueue = this.matchmakingQueue.filter((req) => req.userId !== userId);
  }

  private tryMatchPlayers(): void {
    if (this.matchmakingQueue.length < 2) return;

    const player1 = this.matchmakingQueue.shift()!;
    const player2 = this.matchmakingQueue.shift()!;

    const config = { ...player2.config, ...player1.config };
    const { roomId, room } = this.createOnlineGame(player1.userId, player2.userId, config);

    this.emit('matchFound', {
      roomId,
      player1: player1.userId,
      player2: player2.userId,
    });
  }

  public getUserPosition(roomId: string, userId: string): PlayerPosition | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const state = room.getState();

    if (state.players.left.id === userId) {
      return PlayerPosition.LEFT;
    } else if (state.players.right.id === userId) {
      return PlayerPosition.RIGHT;
    }

    return null;
  }

  public cleanup(): void {
    for (const room of this.rooms.values()) {
      room.cleanup();
    }
    this.rooms.clear();
    this.matchmakingQueue = [];
  }
}
