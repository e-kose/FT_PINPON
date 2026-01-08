import fastify from "fastify";
import * as dotenv from "dotenv";
import { dbPlug } from "./plugins/db.plugin.js";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import fastifyWebsocket from "@fastify/websocket";
import { NotificationRepository } from "./notification/repository/notification.repository.js";
import { NotificationService } from "./notification/service/notification.service.js";
import { WebSocketManager } from "./notification/service/websocket.service.js";
import { notificationRoutes } from "./notification/routes/notification.route.js";
import { webSocketRoutes } from "./notification/routes/websocket.route.js";

dotenv.config();

const host = process.env.HOST || "0.0.0.0";
const port = +(process.env.PORT || "3004");

const app = fastify();
app.register(fastifyWebsocket);
app.register(loggerPlugin);
app.register(sensiblePlugin);
app.register(dbPlug);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);

app.after(() => {
	app.notificationRepo = new NotificationRepository(app.db);
	app.webSocketManager = new WebSocketManager();
	app.notificationService = new NotificationService(app.notificationRepo, app.webSocketManager);
});

app.register(notificationRoutes);
app.register(webSocketRoutes);

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
