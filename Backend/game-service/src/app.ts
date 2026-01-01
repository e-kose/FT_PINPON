import { fastify } from "fastify";
import * as dotenv from "dotenv";
import dbPlugin from "./plugins/db.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { registerGameRoutes } from "./game/routes/game.routes.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const port = +(process.env.PORT || "3005");
const host = process.env.HOST || "0.0.0.0";

const app = fastify({ logger: true });

// Decorators for game service
app.decorate("gameRepo", null);
app.decorate("gameService", null);

// Register plugins
app.register(fastifyWebsocket);
app.register(fastifyStatic, {
  root: join(__dirname, '..', 'public'),
  prefix: '/',
});
app.register(dbPlugin);
app.register(loggerPlugin);
app.register(sensiblePlugin);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);

// Initialize repositories and services after plugins are loaded
app.after(() => {
  // Game repository and service initialization will be added here
  // app.gameRepo = new GameRepository(app.db);
  // app.gameService = new GameService(app.gameRepo);
});

// Register routes
app.register(registerGameRoutes);

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({
      port,
      host,
    });
    app.log.info(`The game service has been started on port ${host}:${port}.`);
  } catch (error) {
    console.log({
      message: `An issue occurred while running the game service server:`,
      error,
    });
    startLogError(app, error);
    process.exit(1);
  }
};

start();
