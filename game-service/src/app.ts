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

// Import services
import { GameService } from "./game/service/game.service.js";
import { StatsService } from "./game/service/stats.service.js";

// Import routes
import { gameRoutes } from "./game/routes/game.routes.js";
import { statsRoutes } from "./game/routes/stats.routes.js";
import { websocketRoutes } from "./game/websocket/handler.js";

dotenv.config();

const port = +(process.env.PORT || "3005");
const host = process.env.HOST || "0.0.0.0";

const app = fastify({ logger: true });

// Register plugins
app.register(fastifyWebsocket);
app.register(dbPlug);

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
  app.decorate("gameRepo", gameRepo);
  app.decorate("statsRepo", statsRepo);
  app.decorate("tournamentRepo", tournamentRepo);

  // Initialize services
  const gameService = new GameService(app.gameRepo, app.statsRepo);
  const statsService = new StatsService(app.statsRepo);
  app.decorate("gameService", gameService);
  app.decorate("statsService", statsService);

  // Decorate placeholder services
  app.decorate("matchmakingService", {});
  app.decorate("tournamentService", {});
});

// Register routes
app.register(gameRoutes, { prefix: "/game" });
app.register(statsRoutes, { prefix: "/game" });
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
