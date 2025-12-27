import type { FastifyRequest, FastifyReply } from "fastify";
import type { TournamentService } from "../service/tournament.service.js";

interface CreateTournamentBody {
  aliases: string[];
  name?: string;
  maxScore?: number;
}

interface ReportResultBody {
  winnerAlias: string;
  player1Score: number;
  player2Score: number;
}

export class TournamentController {
  constructor(private tournamentService: TournamentService) {}

  /**
   * Create a new tournament with aliases
   * POST /tournament/create
   */
  async createTournament(
    request: FastifyRequest<{ Body: CreateTournamentBody }>,
    reply: FastifyReply
  ) {
    try {
      const { aliases, name, maxScore } = request.body;

      const userId = request.headers["x-user-id"]
        ? parseInt(request.headers["x-user-id"] as string)
        : 0;

      const tournament = this.tournamentService.createTournament({
        aliases,
        name,
        maxScore,
        createdBy: userId,
      });

      return reply.status(201).send({
        success: true,
        data: tournament,
        message: "Tournament created successfully",
      });
    } catch (error) {
      request.log.error({ error }, "Error creating tournament");
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get tournament by ID with bracket
   * GET /tournament/:id
   */
  async getTournament(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tournament = this.tournamentService.getTournament(request.params.id);

      return reply.send({
        success: true,
        data: tournament,
      });
    } catch (error) {
      request.log.error({ error }, "Error getting tournament");
      if (error instanceof Error) {
        return reply.status(404).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get next match to be played
   * GET /tournament/:id/next-match
   */
  async getNextMatch(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const match = this.tournamentService.getNextMatch(request.params.id);

      if (!match) {
        return reply.send({
          success: true,
          data: null,
          message: "No pending matches - tournament may be finished",
        });
      }

      return reply.send({
        success: true,
        data: match,
      });
    } catch (error) {
      request.log.error({ error }, "Error getting next match");
      if (error instanceof Error) {
        return reply.status(404).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get full bracket
   * GET /tournament/:id/bracket
   */
  async getBracket(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const bracket = this.tournamentService.getBracket(request.params.id);

      return reply.send({
        success: true,
        data: bracket,
      });
    } catch (error) {
      request.log.error({ error }, "Error getting bracket");
      if (error instanceof Error) {
        return reply.status(404).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Start a specific match
   * POST /tournament/:id/match/:matchId/start
   */
  async startMatch(
    request: FastifyRequest<{ Params: { id: string; matchId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const match = this.tournamentService.startMatch(
        request.params.id,
        request.params.matchId
      );

      return reply.send({
        success: true,
        data: match,
        message: "Match started",
      });
    } catch (error) {
      request.log.error({ error }, "Error starting match");
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Report match result
   * POST /tournament/:id/match/:matchId/result
   */
  async reportMatchResult(
    request: FastifyRequest<{
      Params: { id: string; matchId: string };
      Body: ReportResultBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { winnerAlias, player1Score, player2Score } = request.body;

      const match = this.tournamentService.reportMatchResult(
        request.params.id,
        request.params.matchId,
        winnerAlias,
        player1Score,
        player2Score
      );

      // Get updated bracket
      const bracket = this.tournamentService.getBracket(request.params.id);

      return reply.send({
        success: true,
        data: {
          match,
          bracket,
        },
        message: "Match result recorded",
      });
    } catch (error) {
      request.log.error({ error }, "Error reporting match result");
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Get all tournaments
   * GET /tournament
   */
  async getTournaments(
    request: FastifyRequest<{
      Querystring: { status?: string; limit?: number; offset?: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { status, limit = 20, offset = 0 } = request.query;

      const tournaments = this.tournamentService.getTournaments({
        status,
        limit,
        offset,
      });

      return reply.send({
        success: true,
        data: tournaments,
        count: tournaments.length,
      });
    } catch (error) {
      request.log.error({ error }, "Error getting tournaments");
      throw error;
    }
  }

  /**
   * Cancel a tournament
   * POST /tournament/:id/cancel
   */
  async cancelTournament(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tournament = this.tournamentService.cancelTournament(request.params.id);

      return reply.send({
        success: true,
        data: tournament,
        message: "Tournament cancelled",
      });
    } catch (error) {
      request.log.error({ error }, "Error cancelling tournament");
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  }
}
