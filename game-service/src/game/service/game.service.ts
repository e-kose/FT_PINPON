import type { GameRepository } from "../repository/game.repository.js";
import type { StatsRepository } from "../repository/stats.repository.js";
import type { Game, GameMode, GameStatus } from "../types/game.types.js";
import {
  GameNotFoundError,
  GameAlreadyStartedError,
  GameAlreadyFinishedError
} from "../errors/game.errors.js";

export class GameService {
  constructor(
    private gameRepo: GameRepository,
    private statsRepo: StatsRepository
  ) {}

  /**
   * Create a local game (guest players)
   */
  createLocalGame(
    player1Nickname: string,
    player2Nickname: string,
    maxScore: number = 11
  ): Game {
    return this.gameRepo.create({
      game_mode: 'local',
      player1_id: null,
      player1_nickname: player1Nickname,
      player2_id: null,
      player2_nickname: player2Nickname,
      max_score: maxScore,
      ball_speed_multiplier: 1.0,
    });
  }

  /**
   * Create an online game (authenticated users)
   */
  createOnlineGame(
    player1Id: number,
    player1Nickname: string,
    player2Id: number,
    player2Nickname: string,
    maxScore: number = 11
  ): Game {
    return this.gameRepo.create({
      game_mode: 'online',
      player1_id: player1Id,
      player1_nickname: player1Nickname,
      player2_id: player2Id,
      player2_nickname: player2Nickname,
      max_score: maxScore,
      ball_speed_multiplier: 1.0,
    });
  }

  /**
   * Get game by ID
   */
  getGameById(gameId: string): Game {
    const game = this.gameRepo.findById(gameId);
    if (!game) {
      throw new GameNotFoundError(gameId);
    }
    return game;
  }

  /**
   * Get all games with filters
   */
  getGames(filters?: {
    status?: GameStatus;
    game_mode?: GameMode;
    limit?: number;
    offset?: number;
  }): Game[] {
    return this.gameRepo.findAll(filters);
  }

  /**
   * Get games by player ID
   */
  getPlayerGames(
    userId: number,
    filters?: { limit?: number; offset?: number }
  ): Game[] {
    return this.gameRepo.findByPlayer(userId, filters);
  }

  /**
   * Get active games count
   */
  getActiveGamesCount(): number {
    return this.gameRepo.countActive();
  }

  /**
   * Start a game
   */
  startGame(gameId: string): Game {
    const game = this.getGameById(gameId);

    if (game.status === 'playing') {
      throw new GameAlreadyStartedError();
    }

    if (game.status === 'finished') {
      throw new GameAlreadyFinishedError();
    }

    this.gameRepo.updateStatus(gameId, 'playing');
    return this.getGameById(gameId);
  }

  /**
   * Update game score
   */
  updateScore(gameId: string, player1Score: number, player2Score: number): Game {
    const game = this.getGameById(gameId);

    if (game.status === 'finished') {
      throw new GameAlreadyFinishedError();
    }

    this.gameRepo.updateScore(gameId, player1Score, player2Score);
    return this.getGameById(gameId);
  }

  /**
   * Finish game and determine winner
   */
  finishGame(gameId: string): Game {
    const game = this.getGameById(gameId);

    if (game.status === 'finished') {
      throw new GameAlreadyFinishedError();
    }

    // Determine winner
    let winnerId: number | null = null;
    let winnerNickname: string | null = null;

    if (game.player1_score > game.player2_score) {
      winnerId = game.player1_id;
      winnerNickname = game.player1_nickname;
    } else if (game.player2_score > game.player1_score) {
      winnerId = game.player2_id;
      winnerNickname = game.player2_nickname;
    }

    // Set winner
    this.gameRepo.setWinner(gameId, winnerId, winnerNickname);

    // Update status to finished
    this.gameRepo.updateStatus(gameId, 'finished');

    // Update player stats (only for online/tournament games)
    if (game.game_mode !== 'local') {
      this.updatePlayerStats(game);
    }

    return this.getGameById(gameId);
  }

  /**
   * Cancel a game
   */
  cancelGame(gameId: string): Game {
    const game = this.getGameById(gameId);

    if (game.status === 'finished') {
      throw new GameAlreadyFinishedError();
    }

    this.gameRepo.updateStatus(gameId, 'cancelled');
    return this.getGameById(gameId);
  }

  /**
   * Delete a game
   */
  deleteGame(gameId: string): void {
    this.getGameById(gameId); // Check if exists
    this.gameRepo.delete(gameId);
  }

  /**
   * Update player statistics after game finishes
   */
  private updatePlayerStats(game: Game): void {
    if (!game.player1_id || !game.player2_id) return;

    // Ensure stats exist for both players
    this.statsRepo.getOrCreate(game.player1_id);
    this.statsRepo.getOrCreate(game.player2_id);

    // Increment games played
    this.statsRepo.incrementGames(game.player1_id);
    this.statsRepo.incrementGames(game.player2_id);

    // Determine winner and update stats
    if (game.player1_score > game.player2_score) {
      // Player 1 wins
      this.statsRepo.recordWin(game.player1_id, game.player1_score, game.player2_score);
      this.statsRepo.recordLoss(game.player2_id, game.player2_score, game.player1_score);
    } else if (game.player2_score > game.player1_score) {
      // Player 2 wins
      this.statsRepo.recordWin(game.player2_id, game.player2_score, game.player1_score);
      this.statsRepo.recordLoss(game.player1_id, game.player1_score, game.player2_score);
    } else {
      // Draw
      this.statsRepo.recordDraw(game.player1_id, game.player1_score);
      this.statsRepo.recordDraw(game.player2_id, game.player2_score);
    }
  }
}
