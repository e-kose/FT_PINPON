import fastify from "fastify";
import * as dotenv from "dotenv";
import { dbPlug } from "./plugins/db.plugin.js";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import multipart from "@fastify/multipart";
import r2Plugin from "./plugins/r2.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import { fileURLToPath } from "url";
import fastifyWebsocket from "@fastify/websocket";
import { NotificationRepository } from "./notification/repository/notification.repository.js";
import { NotificationService } from "./notification/service/notification.service.js";
import { WebSocketManager } from "./notification/service/websocket.service.js";
import { notificationRoutes } from "./notification/routes/notification.route.js";
import { webSocketRoutes } from "./notification/routes/websocket.route.js";

const __filename = fileURLToPath(import.meta.url);

dotenv.config();

// Environment variables with defaults
const host = process.env.HOST || "localhost";
const port = +(process.env.PORT || "3004");
const nodeEnv = process.env.NODE_ENV || "development";
const logLevel = process.env.LOG_LEVEL || "info";
const dbPath = process.env.DB_PATH || "./db/notifications.db";

// FastifyOptions with environment-based logger configuration
const fastifyOptions = {
  logger: nodeEnv === 'production' ? { level: logLevel } : true
};

const app = fastify(fastifyOptions);
app.register(fastifyWebsocket);
app.register(loggerPlugin);
app.register(sensiblePlugin);
app.register(multipart);
app.register(r2Plugin);
app.register(dbPlug);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);

app.after(() => {
	app.notificationRepo = new NotificationRepository(app.db);
	app.webSocketManager = new WebSocketManager();
	app.notificationService = new NotificationService(app.notificationRepo, app.webSocketManager);
});

// Register notification routes
app.register(notificationRoutes);

// Register WebSocket routes
app.register(webSocketRoutes);

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({
      host,
      port,
    });
    app.logger.info(`The notification service has been started on port ${host}:${port}.`);
    app.logger.info(`WebSocket endpoint: ws://${host}:${port}/notification/ws`);
  } catch (error: any) {
    console.log({
      message: "An issue occurred while running the notification service server:",
      error,
    });
    startLogError(app, error);
    process.exit(1);
  }
};

start();
