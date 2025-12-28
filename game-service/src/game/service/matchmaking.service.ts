import type { GameService } from "./game.service.js";
import type { Game } from "../types/game.types.js";

// ============================================================================
// TYPES
// ============================================================================

export interface QueuedPlayer {
  playerId: number;
  nickname: string;
  preferredMaxScore: number;
  joinedAt: number;
  rank?: number; // ELO-based rank for future ranked matching
}

export interface MatchmakingResult {
  matched: boolean;
  game?: Game;
  opponent?: QueuedPlayer;
}

export interface QueueStatus {
  inQueue: boolean;
  position?: number;
  waitTime?: number; // in seconds
  queueSize: number;
}

// ============================================================================
// MATCHMAKING SERVICE
// ============================================================================

export class MatchmakingService {
  /** FIFO queue of waiting players */
  private waitingPlayers: QueuedPlayer[] = [];

  /** Map for O(1) lookup: playerId -> index in queue */
  private playerIndex: Map<number, number> = new Map();

  constructor(private gameService: GameService) {}

  /**
   * Add player to matchmaking queue (FIFO)
   * @returns MatchmakingResult - if matched, contains the created game
   */
  addToQueue(player: Omit<QueuedPlayer, "joinedAt">): MatchmakingResult {
    // Check if player is already in queue
    if (this.playerIndex.has(player.playerId)) {
      console.log(`[Matchmaking] Player ${player.playerId} already in queue`);
      return { matched: false };
    }

    // Try to find a match first
    const match = this.findMatch(player);
    if (match) {
      // Match found! Create game and return
      const game = this.createMatchedGame(player, match);
      return {
        matched: true,
        game,
        opponent: match,
      };
    }

    // No match found, add to queue
    const queuedPlayer: QueuedPlayer = {
      ...player,
      joinedAt: Date.now(),
    };

    this.waitingPlayers.push(queuedPlayer);
    this.playerIndex.set(player.playerId, this.waitingPlayers.length - 1);

    console.log(
      `[Matchmaking] Player ${player.playerId} (${player.nickname}) added to queue. Queue size: ${this.waitingPlayers.length}`
    );

    return { matched: false };
  }

  /**
   * Remove player from matchmaking queue
   * @returns true if player was in queue and removed
   */
  removeFromQueue(playerId: number): boolean {
    const index = this.playerIndex.get(playerId);
    if (index === undefined) {
      return false;
    }

    // Remove from array
    this.waitingPlayers.splice(index, 1);
    this.playerIndex.delete(playerId);

    // Rebuild index (necessary after splice)
    this.rebuildIndex();

    console.log(
      `[Matchmaking] Player ${playerId} removed from queue. Queue size: ${this.waitingPlayers.length}`
    );

    return true;
  }

  /**
   * Get player's queue status
   */
  getQueueStatus(playerId: number): QueueStatus {
    const index = this.playerIndex.get(playerId);

    if (index === undefined) {
      return {
        inQueue: false,
        queueSize: this.waitingPlayers.length,
      };
    }

    const player = this.waitingPlayers[index];
    const waitTime = Math.floor((Date.now() - player.joinedAt) / 1000);

    return {
      inQueue: true,
      position: index + 1,
      waitTime,
      queueSize: this.waitingPlayers.length,
    };
  }

  /**
   * Get total queue size
   */
  getQueueSize(): number {
    return this.waitingPlayers.length;
  }

  /**
   * Find a suitable match for a player (FIFO - first waiting player)
   * Can be enhanced with ELO matching in the future
   */
  private findMatch(newPlayer: Omit<QueuedPlayer, "joinedAt">): QueuedPlayer | null {
    if (this.waitingPlayers.length === 0) {
      return null;
    }

    // Simple FIFO: return the first player in queue
    // Future enhancement: could match based on rank, preferred settings, etc.
    const matchedPlayer = this.waitingPlayers[0];

    // Remove matched player from queue
    this.waitingPlayers.shift();
    this.playerIndex.delete(matchedPlayer.playerId);
    this.rebuildIndex();

    console.log(
      `[Matchmaking] Match found: ${newPlayer.nickname} vs ${matchedPlayer.nickname}`
    );

    return matchedPlayer;
  }

  /**
   * Create a game for matched players
   */
  private createMatchedGame(
    player1: Omit<QueuedPlayer, "joinedAt">,
    player2: QueuedPlayer
  ): Game {
    // Use the lower of the two preferred max scores, or default to 11
    const maxScore = Math.min(
      player1.preferredMaxScore || 11,
      player2.preferredMaxScore || 11
    );

    const game = this.gameService.createOnlineGame(
      player1.playerId,
      player1.nickname,
      player2.playerId,
      player2.nickname,
      maxScore
    );

    console.log(
      `[Matchmaking] Created game ${game.id} for players ${player1.playerId} vs ${player2.playerId}`
    );

    return game;
  }

  /**
   * Rebuild the playerIndex map after array modifications
   */
  private rebuildIndex(): void {
    this.playerIndex.clear();
    for (let i = 0; i < this.waitingPlayers.length; i++) {
      this.playerIndex.set(this.waitingPlayers[i].playerId, i);
    }
  }

  /**
   * Clean up stale entries (players who have been waiting too long)
   * @param maxWaitTimeMs Maximum wait time in milliseconds (default: 5 minutes)
   */
  cleanupStaleEntries(maxWaitTimeMs: number = 300000): number {
    const now = Date.now();
    let removedCount = 0;

    // Filter out stale entries
    const freshPlayers = this.waitingPlayers.filter((player) => {
      const isStale = now - player.joinedAt > maxWaitTimeMs;
      if (isStale) {
        removedCount++;
        console.log(
          `[Matchmaking] Removing stale player ${player.playerId} from queue (waited ${Math.floor((now - player.joinedAt) / 1000)}s)`
        );
      }
      return !isStale;
    });

    if (removedCount > 0) {
      this.waitingPlayers = freshPlayers;
      this.rebuildIndex();
    }

    return removedCount;
  }

  /**
   * Get all waiting players (for debugging/admin)
   */
  getWaitingPlayers(): QueuedPlayer[] {
    return [...this.waitingPlayers];
  }

  /**
   * Clear the entire queue (for testing/admin)
   */
  clearQueue(): void {
    this.waitingPlayers = [];
    this.playerIndex.clear();
    console.log("[Matchmaking] Queue cleared");
  }
}
