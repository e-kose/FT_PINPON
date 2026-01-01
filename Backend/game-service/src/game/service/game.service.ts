/**
 * Game Service
 * Business logic layer for game management
 */

import { GameRoom } from '../engine/game.room.js';
import { RoomManager } from '../engine/room.manager.js';
import { PlayerPosition, InputAction, type GameConfig } from '../types/game.types.js';

export class GameService {
  private roomManager: RoomManager;

  constructor() {
    this.roomManager = new RoomManager();
  }

  public createLocalGame(userId: string, config?: Partial<GameConfig>): { roomId: string; room: GameRoom } {
    return this.roomManager.createLocalGame(userId, config);
  }

  public joinMatchmaking(userId: string, config?: Partial<GameConfig>): void {
    this.roomManager.addToMatchmakingQueue(userId, config);
  }

  public leaveMatchmaking(userId: string): void {
    this.roomManager.removeFromMatchmakingQueue(userId);
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.roomManager.getRoom(roomId);
  }

  public getUserPosition(roomId: string, userId: string): PlayerPosition | null {
    return this.roomManager.getUserPosition(roomId, userId);
  }

  public handlePlayerInput(roomId: string, position: PlayerPosition, action: InputAction): void {
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.handleInput(position, action);
    }
  }

  public getRoomManager(): RoomManager {
    return this.roomManager;
  }

  public deleteRoom(roomId: string): void {
    this.roomManager.deleteRoom(roomId);
  }

  public cleanup(): void {
    this.roomManager.cleanup();
  }
}
