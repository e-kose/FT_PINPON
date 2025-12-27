import { fastify, FastifyInstance } from "fastify";
import * as dotenv from "dotenv";
import { dbPlug } from "./plugins/db.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import fastifySensible from "@fastify/sensible";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import redisPlugin from "./plugins/redis.plugin.js";
import fastifyWebsocket from "@fastify/websocket";

// Import repositories
import { GameRepository } from "./game/repository/game.repository.js";
import { StatsRepository } from "./game/repository/stats.repository.js";
import { TournamentRepository } from "./game/repository/tournament.repository.js";
import { InviteRepository } from "./game/repository/invite.repository.js";

// Import services
import { GameService } from "./game/service/game.service.js";
import { StatsService } from "./game/service/stats.service.js";
import { MatchmakingService } from "./game/service/matchmaking.service.js";
import { MatchmakingServiceRedis } from "./game/service/matchmaking-redis.service.js";
import { InviteService } from "./game/service/invite.service.js";
import { TournamentService } from "./game/service/tournament.service.js";

// Import routes
import { gameRoutes } from "./game/routes/game.routes.js";
import { statsRoutes } from "./game/routes/stats.routes.js";
import { websocketRoutes } from "./game/websocket/handler.js";
import { tournamentRoutes } from "./game/routes/tournament.routes.js";

dotenv.config();

const port = +(process.env.PORT || "3005");
const host = process.env.HOST || "0.0.0.0";

const app = fastify({ logger: true });

// Register plugins
app.register(fastifyWebsocket);
app.register(dbPlug);

// Lightweight CORS handling for browser preflight (avoids adding dependency)
app.addHook('onRequest', async (request, reply) => {
  reply.header('access-control-allow-origin', '*');
  reply.header('access-control-allow-methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  reply.header('access-control-allow-headers', 'Content-Type, Authorization, x-user-id');
  if (request.raw.method === 'OPTIONS') {
    reply.code(204).send();
  }
});

app.register(redisPlugin);
app.register(loggerPlugin);
app.register(fastifySensible);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);

// Initialize and decorate repositories and services after db plugin
app.after(() => {
  const gameRepo = new GameRepository(app.db);
  const statsRepo = new StatsRepository(app.db);
  const tournamentRepo = new TournamentRepository(app.db);
  const inviteRepo = new InviteRepository(app.db);
  app.decorate("gameRepo", gameRepo);
  app.decorate("statsRepo", statsRepo);
  app.decorate("tournamentRepo", tournamentRepo);
  app.decorate("inviteRepo", inviteRepo);

  // Initialize services
  const gameService = new GameService(app.gameRepo, app.statsRepo);
  const statsService = new StatsService(app.statsRepo);
  // Prefer Redis-backed matchmaking when redis is available
  let matchmakingService: any;
  if ((app as any).redis) {
    matchmakingService = new MatchmakingServiceRedis((app as any).redis, gameService);
  } else {
    matchmakingService = new MatchmakingService(gameService);
  }
  const inviteService = new InviteService(inviteRepo, gameService);
  const tournamentService = new TournamentService(tournamentRepo, gameService);

  app.decorate("gameService", gameService);
  app.decorate("statsService", statsService);
  app.decorate("matchmakingService", matchmakingService);
  app.decorate("inviteService", inviteService);
  app.decorate("tournamentService", tournamentService);
});

// Register routes
app.register(gameRoutes, { prefix: "/game" });
app.register(statsRoutes, { prefix: "/game" });
app.register(tournamentRoutes, { prefix: "/game/tournament" });
app.register(websocketRoutes, { prefix: "/game" });
app.register(healthCheckRoutes, { prefix: "/game" });

// Health check plugin
async function healthCheckRoutes(app: FastifyInstance) {
  app.get("/health", async (request, reply) => {
    return {
      status: "healthy",
      service: "game-service",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}

const start = async () => {
  try {
    await app.listen({
      port,
      host,
    });
    app.log.info(`✓ Game service started on ${host}:${port}`);
    console.log(`✓ Game service started on ${host}:${port}`);
  } catch (error) {
    console.log({
      message: `An issue occurred while running the game service server:`,
      error,
    });
    startLogError(app, error as Error);
    process.exit(1);
	}
};

app.addHook('onClose', (instance, done) => {
  if (instance.db && instance.db.open) {
    instance.db.close();
    console.log('Database connection closed.');
  }
  done();
});

start();
