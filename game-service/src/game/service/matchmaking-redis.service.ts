import type { Redis } from "ioredis";
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
// REDIS KEYS
// ============================================================================

const QUEUE_KEY = "matchmaking:queue"; // List of player IDs (FIFO)
const PLAYER_DATA_KEY = "matchmaking:player:"; // Hash for player data
const LOCK_KEY = "matchmaking:lock"; // Distributed lock for atomic operations

// ============================================================================
// REDIS-BACKED MATCHMAKING SERVICE
// ============================================================================

export class MatchmakingServiceRedis {
  constructor(
    private redis: Redis,
    private gameService: GameService
  ) {}

  /**
   * Add player to matchmaking queue (FIFO) with Redis persistence
   * @returns MatchmakingResult - if matched, contains the created game
   */
  async addToQueue(player: Omit<QueuedPlayer, "joinedAt">): Promise<MatchmakingResult> {
    const lockKey = `${LOCK_KEY}:${player.playerId}`;

    try {
      // Try to acquire lock for atomic operation
      const lockAcquired = await this.redis.set(lockKey, "1", "EX", 10, "NX");
      if (!lockAcquired) {
        console.log(`[Matchmaking] Player ${player.playerId} - operation in progress`);
        return { matched: false };
      }

      // Check if player is already in queue
      const isInQueue = await this.isPlayerInQueue(player.playerId);
      if (isInQueue) {
        console.log(`[Matchmaking] Player ${player.playerId} already in queue`);
        return { matched: false };
      }

      // Try to find a match first
      const match = await this.findMatch(player);
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

      // Store player data in hash
      await this.redis.hset(
        `${PLAYER_DATA_KEY}${player.playerId}`,
        "playerId", player.playerId.toString(),
        "nickname", player.nickname,
        "preferredMaxScore", player.preferredMaxScore.toString(),
        "joinedAt", queuedPlayer.joinedAt.toString(),
        "rank", (player.rank || 0).toString()
      );

      // Set expiry for player data (5 minutes)
      await this.redis.expire(`${PLAYER_DATA_KEY}${player.playerId}`, 300);

      // Add to queue list (FIFO - rpush)
      await this.redis.rpush(QUEUE_KEY, player.playerId.toString());

      const queueSize = await this.redis.llen(QUEUE_KEY);
      console.log(
        `[Matchmaking] Player ${player.playerId} (${player.nickname}) added to queue. Queue size: ${queueSize}`
      );

      return { matched: false };
    } finally {
      // Release lock
      await this.redis.del(lockKey);
    }
  }

  /**
   * Remove player from matchmaking queue
   * @returns true if player was in queue and removed
   */
  async removeFromQueue(playerId: number): Promise<boolean> {
    const removed = await this.redis.lrem(QUEUE_KEY, 1, playerId.toString());

    if (removed > 0) {
      // Clean up player data
      await this.redis.del(`${PLAYER_DATA_KEY}${playerId}`);

      const queueSize = await this.redis.llen(QUEUE_KEY);
      console.log(
        `[Matchmaking] Player ${playerId} removed from queue. Queue size: ${queueSize}`
      );
      return true;
    }

    return false;
  }

  /**
   * Check if player is in queue
   */
  async isPlayerInQueue(playerId: number): Promise<boolean> {
    // Check if player data exists
    const exists = await this.redis.exists(`${PLAYER_DATA_KEY}${playerId}`);
    return exists === 1;
  }

  /**
   * Get player's queue status
   */
  async getQueueStatus(playerId: number): Promise<QueueStatus> {
    const queueSize = await this.redis.llen(QUEUE_KEY);

    // Find position in queue
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);
    const position = queue.indexOf(playerId.toString());

    if (position === -1) {
      return {
        inQueue: false,
        queueSize,
      };
    }

    // Get player data for wait time
    const playerData = await this.redis.hgetall(`${PLAYER_DATA_KEY}${playerId}`);
    const joinedAt = parseInt(playerData.joinedAt || "0", 10);
    const waitTime = joinedAt > 0 ? Math.floor((Date.now() - joinedAt) / 1000) : 0;

    return {
      inQueue: true,
      position: position + 1,
      waitTime,
      queueSize,
    };
  }

  /**
   * Get total queue size
   */
  async getQueueSize(): Promise<number> {
    return await this.redis.llen(QUEUE_KEY);
  }

  /**
   * Find a suitable match for a player (FIFO - first waiting player)
   */
  private async findMatch(newPlayer: Omit<QueuedPlayer, "joinedAt">): Promise<QueuedPlayer | null> {
    // Pop first player from queue (FIFO - lpop)
    const matchedPlayerId = await this.redis.lpop(QUEUE_KEY);

    if (!matchedPlayerId) {
      return null;
    }

    // Get matched player data
    const playerData = await this.redis.hgetall(`${PLAYER_DATA_KEY}${matchedPlayerId}`);

    if (!playerData || !playerData.playerId) {
      // Stale entry, try next
      console.log(`[Matchmaking] Stale entry found for player ${matchedPlayerId}, cleaning up`);
      return this.findMatch(newPlayer);
    }

    // Clean up matched player data
    await this.redis.del(`${PLAYER_DATA_KEY}${matchedPlayerId}`);

    const matchedPlayer: QueuedPlayer = {
      playerId: parseInt(playerData.playerId, 10),
      nickname: playerData.nickname,
      preferredMaxScore: parseInt(playerData.preferredMaxScore, 10),
      joinedAt: parseInt(playerData.joinedAt, 10),
      rank: playerData.rank ? parseInt(playerData.rank, 10) : undefined,
    };

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
   * Clean up stale entries (players who have been waiting too long)
   * @param maxWaitTimeMs Maximum wait time in milliseconds (default: 5 minutes)
   */
  async cleanupStaleEntries(maxWaitTimeMs: number = 300000): Promise<number> {
    const now = Date.now();
    let removedCount = 0;

    // Get all players in queue
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);

    for (const playerIdStr of queue) {
      const playerData = await this.redis.hgetall(`${PLAYER_DATA_KEY}${playerIdStr}`);

      if (!playerData || !playerData.joinedAt) {
        // Stale entry without data
        await this.redis.lrem(QUEUE_KEY, 1, playerIdStr);
        removedCount++;
        continue;
      }

      const joinedAt = parseInt(playerData.joinedAt, 10);
      if (now - joinedAt > maxWaitTimeMs) {
        await this.removeFromQueue(parseInt(playerIdStr, 10));
        removedCount++;
        console.log(
          `[Matchmaking] Removing stale player ${playerIdStr} from queue (waited ${Math.floor((now - joinedAt) / 1000)}s)`
        );
      }
    }

    return removedCount;
  }

  /**
   * Get all waiting players (for debugging/admin)
   */
  async getWaitingPlayers(): Promise<QueuedPlayer[]> {
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);
    const players: QueuedPlayer[] = [];

    for (const playerIdStr of queue) {
      const playerData = await this.redis.hgetall(`${PLAYER_DATA_KEY}${playerIdStr}`);
      if (playerData && playerData.playerId) {
        players.push({
          playerId: parseInt(playerData.playerId, 10),
          nickname: playerData.nickname,
          preferredMaxScore: parseInt(playerData.preferredMaxScore, 10),
          joinedAt: parseInt(playerData.joinedAt, 10),
          rank: playerData.rank ? parseInt(playerData.rank, 10) : undefined,
        });
      }
    }

    return players;
  }

  /**
   * Clear the entire queue (for testing/admin)
   */
  async clearQueue(): Promise<void> {
    // Get all player IDs first
    const queue = await this.redis.lrange(QUEUE_KEY, 0, -1);

    // Delete all player data
    for (const playerIdStr of queue) {
      await this.redis.del(`${PLAYER_DATA_KEY}${playerIdStr}`);
    }

    // Delete queue
    await this.redis.del(QUEUE_KEY);
    console.log("[Matchmaking] Queue cleared");
  }
}
