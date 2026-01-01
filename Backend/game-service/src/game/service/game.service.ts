/**
 * Game Service
 * Business logic layer for game management
 */

import { GameRoom } from '../engine/game.room.js';
import { RoomManager } from '../engine/room.manager.js';
import { TournamentManager } from '../engine/tournament.manager.js';
import { Tournament } from '../engine/tournament.js';
import type { TournamentSize } from '../types/tournament.types.js';
import { PlayerPosition, InputAction, type GameConfig } from '../types/game.types.js';

export class GameService {
  private roomManager: RoomManager;
  private tournamentManager: TournamentManager;

  constructor() {
    this.roomManager = new RoomManager();
    this.tournamentManager = new TournamentManager(this.roomManager);
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

  // ==========================================================================
  // Tournament Methods
  // ==========================================================================

  public createTournament(size: TournamentSize): Tournament {
    return this.tournamentManager.createTournament(size);
  }

  public joinTournament(tournamentId: string, userId: string): Tournament | null {
    return this.tournamentManager.joinTournament(tournamentId, userId);
  }

  public leaveTournament(tournamentId: string, userId: string): void {
    return this.tournamentManager.leaveTournament(tournamentId, userId);
  }

  public joinTournamentQueue(userId: string, size: TournamentSize): { success: boolean, waiting: number } {
    return this.tournamentManager.joinQueue(userId, size);
  }

  public leaveTournamentQueue(userId: string): void {
    return this.tournamentManager.leaveQueue(userId);
  }

  public getTournament(tournamentId: string): Tournament | undefined {
    return this.tournamentManager.getTournament(tournamentId);
  }

  public getTournamentByPlayer(userId: string): Tournament | undefined {
    return this.tournamentManager.getTournamentByPlayer(userId);
  }

  public getTournamentManager(): TournamentManager {
    return this.tournamentManager;
  }

  public cleanup(): void {
    this.roomManager.cleanup();
    this.tournamentManager.cleanup();
  }
}
