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
import type { InviteRepository } from "../game/repository/invite.repository.js";
import type { InviteService } from "../game/service/invite.service.js";
import type { GameStateManager } from "../game/websocket/state-manager.js";

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
    inviteRepo: InviteRepository;
    inviteService: InviteService;
    stateManager: GameStateManager;
    wsClients: Map<string, Set<any>>;
  }
}
