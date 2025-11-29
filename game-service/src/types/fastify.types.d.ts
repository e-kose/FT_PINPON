import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import type Redis from "ioredis";
import type { GameRepository } from "../game/repository/game.repository.js";
import type { GameService } from "../game/service/game.service.js";
import type { MatchmakingService } from "../game/service/matchmaking.service.js";
import type { TournamentRepository } from "../game/repository/tournament.repository.js";
import type { TournamentService } from "../game/service/tournament.service.js";
import type { StatsRepository } from "../game/repository/stats.repository.js";
import type { StatsService } from "../game/service/stats.service.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
    redis: Redis;
    gameRepo: GameRepository;
    gameService: GameService;
    matchmakingService: MatchmakingService;
    tournamentRepo: TournamentRepository;
    tournamentService: TournamentService;
    statsRepo: StatsRepository;
    statsService: StatsService;
  }
}
