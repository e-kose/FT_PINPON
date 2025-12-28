import type { TournamentRepository } from "../repository/tournament.repository.js";
import type { GameService } from "./game.service.js";
import type {
  Tournament,
  TournamentMatch,
  TournamentBracket,
  TournamentRound,
  TournamentMatchStatus,
  PlayerIdentifier,
} from "../types/game.types.js";
import {
  TournamentNotFoundError,
  TournamentFullError,
  TournamentAlreadyStartedError,
} from "../errors/game.errors.js";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTournamentInput {
  aliases: string[]; // 4 veya 8 alias
  name?: string;
  maxScore?: number;
  createdBy?: number; // Admin user ID (optional)
}

export interface TournamentWithBracket extends Tournament {
  bracket: TournamentBracket;
}

// ============================================================================
// TOURNAMENT SERVICE
// ============================================================================

export class TournamentService {
  constructor(
    private tournamentRepo: TournamentRepository,
    private gameService: GameService
  ) {}

  /**
   * Create a new tournament with aliases (no user management required)
   * Supports 4 or 8 players
   */
  createTournament(input: CreateTournamentInput): TournamentWithBracket {
    const { aliases, name, maxScore = 11, createdBy = 0 } = input;

    // Validate player count
    if (aliases.length !== 4 && aliases.length !== 8) {
      throw new Error("Tournament must have exactly 4 or 8 players");
    }

    // Check for duplicate aliases
    const uniqueAliases = new Set(aliases);
    if (uniqueAliases.size !== aliases.length) {
      throw new Error("All aliases must be unique");
    }

    // Validate alias format
    for (const alias of aliases) {
      if (!alias || alias.length < 2 || alias.length > 20) {
        throw new Error(`Invalid alias: "${alias}". Must be 2-20 characters`);
      }
    }

    // Create tournament record
    const tournament = this.tournamentRepo.create({
      name: name || `Tournament ${Date.now()}`,
      format: "single_elimination",
      max_players: aliases.length,
      created_by: createdBy,
    });

    // Shuffle aliases for random bracket
    const shuffledAliases = this.shuffleArray([...aliases]);

    // Generate bracket
    const bracket = this.generateBracket(tournament.id, shuffledAliases, maxScore);

    // Update tournament status to in_progress
    this.tournamentRepo.updateStatus(tournament.id, "in_progress");

    return {
      ...this.tournamentRepo.findById(tournament.id)!,
      bracket,
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate tournament bracket (single elimination)
   * 4 players: Semi-Finals -> Final
   * 8 players: Quarter-Finals -> Semi-Finals -> Final
   */
  private generateBracket(
    tournamentId: string,
    aliases: string[],
    maxScore: number
  ): TournamentBracket {
    const matches: TournamentMatch[] = [];
    const playerCount = aliases.length;

    if (playerCount === 4) {
      // 4 players: 2 semi-finals + 1 final
      const final = this.createMatch(tournamentId, "final", 1);
      matches.push(final);

      const sf1 = this.createMatch(tournamentId, "semi_final", 1, final.id, "player1");
      sf1.player1_alias = aliases[0];
      sf1.player2_alias = aliases[1];
      sf1.status = "ready";

      const sf2 = this.createMatch(tournamentId, "semi_final", 2, final.id, "player2");
      sf2.player1_alias = aliases[2];
      sf2.player2_alias = aliases[3];
      sf2.status = "ready";

      matches.push(sf1, sf2);
    } else if (playerCount === 8) {
      // 8 players: 4 quarter-finals + 2 semi-finals + 1 final
      const final = this.createMatch(tournamentId, "final", 1);
      matches.push(final);

      const sf1 = this.createMatch(tournamentId, "semi_final", 1, final.id, "player1");
      const sf2 = this.createMatch(tournamentId, "semi_final", 2, final.id, "player2");
      matches.push(sf1, sf2);

      // Quarter-finals
      const qf1 = this.createMatch(tournamentId, "quarter_final", 1, sf1.id, "player1");
      qf1.player1_alias = aliases[0];
      qf1.player2_alias = aliases[1];
      qf1.status = "ready";

      const qf2 = this.createMatch(tournamentId, "quarter_final", 2, sf1.id, "player2");
      qf2.player1_alias = aliases[2];
      qf2.player2_alias = aliases[3];
      qf2.status = "ready";

      const qf3 = this.createMatch(tournamentId, "quarter_final", 3, sf2.id, "player1");
      qf3.player1_alias = aliases[4];
      qf3.player2_alias = aliases[5];
      qf3.status = "ready";

      const qf4 = this.createMatch(tournamentId, "quarter_final", 4, sf2.id, "player2");
      qf4.player1_alias = aliases[6];
      qf4.player2_alias = aliases[7];
      qf4.status = "ready";

      matches.push(qf1, qf2, qf3, qf4);
    }

    // Save matches to database
    for (const match of matches) {
      this.tournamentRepo.createMatch(match);
    }

    return this.buildBracketStructure(tournamentId, matches);
  }

  /**
   * Create a single match object
   */
  private createMatch(
    tournamentId: string,
    round: TournamentRound,
    order: number,
    nextMatchId?: string,
    nextMatchSlot?: "player1" | "player2"
  ): TournamentMatch {
    return {
      id: nanoid(),
      tournament_id: tournamentId,
      round,
      match_order: order,
      player1_alias: null,
      player2_alias: null,
      player1_id: null,
      player2_id: null,
      winner_alias: null,
      winner_id: null,
      player1_score: 0,
      player2_score: 0,
      status: "pending",
      game_id: null,
      next_match_id: nextMatchId || null,
      next_match_slot: nextMatchSlot || null,
      created_at: Math.floor(Date.now() / 1000),
      started_at: null,
      finished_at: null,
    };
  }

  /**
   * Build bracket structure from matches
   */
  private buildBracketStructure(
    tournamentId: string,
    matches: TournamentMatch[]
  ): TournamentBracket {
    const roundOrder: TournamentRound[] = ["quarter_final", "semi_final", "final"];

    const rounds = roundOrder
      .map((roundName) => ({
        name: roundName,
        matches: matches
          .filter((m) => m.round === roundName)
          .sort((a, b) => a.match_order - b.match_order),
      }))
      .filter((r) => r.matches.length > 0);

    // Find current round (first round with pending/ready matches)
    let currentRound: TournamentRound = "final";
    for (const round of rounds) {
      if (round.matches.some((m) => m.status === "ready" || m.status === "active")) {
        currentRound = round.name;
        break;
      }
    }

    return {
      tournamentId,
      format: "single_elimination",
      rounds,
      currentRound,
    };
  }

  /**
   * Get tournament by ID with bracket
   */
  getTournament(tournamentId: string): TournamentWithBracket {
    const tournament = this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new TournamentNotFoundError(tournamentId);
    }

    const matches = this.tournamentRepo.getMatches(tournamentId);
    const bracket = this.buildBracketStructure(tournamentId, matches);

    return { ...tournament, bracket };
  }

  /**
   * Get the next match to be played
   */
  getNextMatch(tournamentId: string): TournamentMatch | null {
    const tournament = this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new TournamentNotFoundError(tournamentId);
    }

    // First check for active match
    const activeMatch = this.tournamentRepo.getActiveMatch(tournamentId);
    if (activeMatch) {
      return activeMatch;
    }

    // Then get first ready match
    const readyMatch = this.tournamentRepo.getNextReadyMatch(tournamentId);
    return readyMatch || null;
  }

  /**
   * Get full bracket for display
   */
  getBracket(tournamentId: string): TournamentBracket {
    const tournament = this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new TournamentNotFoundError(tournamentId);
    }

    const matches = this.tournamentRepo.getMatches(tournamentId);
    return this.buildBracketStructure(tournamentId, matches);
  }

  /**
   * Start a match (create actual game instance)
   */
  startMatch(tournamentId: string, matchId: string): TournamentMatch {
    const match = this.tournamentRepo.getMatchById(matchId);
    if (!match || match.tournament_id !== tournamentId) {
      throw new Error("Match not found");
    }

    if (match.status !== "ready") {
      throw new Error(`Cannot start match with status: ${match.status}`);
    }

    if (!match.player1_alias || !match.player2_alias) {
      throw new Error("Both players must be assigned to start match");
    }

    // Create actual game for this match
    const game = this.gameService.createLocalGame(
      match.player1_alias,
      match.player2_alias,
      11 // max score
    );

    // Update match status
    this.tournamentRepo.updateMatchStatus(matchId, "active");
    this.tournamentRepo.setMatchGame(matchId, game.id);

    return this.tournamentRepo.getMatchById(matchId)!;
  }

  /**
   * Report match result and advance winner
   */
  reportMatchResult(
    tournamentId: string,
    matchId: string,
    winnerAlias: string,
    player1Score: number,
    player2Score: number
  ): TournamentMatch {
    const match = this.tournamentRepo.getMatchById(matchId);
    if (!match || match.tournament_id !== tournamentId) {
      throw new Error("Match not found");
    }

    if (match.status !== "active" && match.status !== "ready") {
      throw new Error(`Cannot report result for match with status: ${match.status}`);
    }

    // Validate winner
    if (winnerAlias !== match.player1_alias && winnerAlias !== match.player2_alias) {
      throw new Error("Winner must be one of the players");
    }

    // Update match with result
    this.tournamentRepo.setMatchResult(matchId, winnerAlias, player1Score, player2Score);
    this.tournamentRepo.updateMatchStatus(matchId, "finished");

    // Advance winner to next match
    if (match.next_match_id && match.next_match_slot) {
      this.tournamentRepo.setMatchPlayer(
        match.next_match_id,
        match.next_match_slot,
        winnerAlias
      );

      // Check if next match is now ready
      const nextMatch = this.tournamentRepo.getMatchById(match.next_match_id);
      if (nextMatch && nextMatch.player1_alias && nextMatch.player2_alias) {
        this.tournamentRepo.updateMatchStatus(match.next_match_id, "ready");
      }
    } else {
      // This was the final match - tournament is finished
      this.tournamentRepo.setWinner(tournamentId, 0, winnerAlias);
    }

    return this.tournamentRepo.getMatchById(matchId)!;
  }

  /**
   * Get all matches for a tournament
   */
  getMatches(tournamentId: string): TournamentMatch[] {
    const tournament = this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new TournamentNotFoundError(tournamentId);
    }

    return this.tournamentRepo.getMatches(tournamentId);
  }

  /**
   * Cancel a tournament
   */
  cancelTournament(tournamentId: string): Tournament {
    const tournament = this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new TournamentNotFoundError(tournamentId);
    }

    this.tournamentRepo.updateStatus(tournamentId, "cancelled");
    return this.tournamentRepo.findById(tournamentId)!;
  }

  /**
   * Get all tournaments with optional filters
   */
  getTournaments(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Tournament[] {
    return this.tournamentRepo.findAll(filters as any);
  }
}
