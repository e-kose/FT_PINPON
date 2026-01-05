import { fastify } from "fastify";
import * as dotenv from "dotenv";
import dbPlugin from "./plugins/db.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import fastifySensible from "@fastify/sensible";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import { ChatRepository } from "./chat/repository/chat.repository.js";
import { ChatService } from "./chat/service/chat.service.js";
import { chatRoute } from "./chat/routes/chat.route.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import redisPlugin from "./plugins/redis.plugin.js";
import fastifyWebsocket from "@fastify/websocket";

dotenv.config();
const port = +(process.env.PORT || "3003");
const host = process.env.HOST || "0.0.0.0";

const app = fastify({ logger: true });
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});
app.decorate("messageRepo", null);
app.decorate("messageService", null);

app.register(fastifyWebsocket);
app.register(dbPlugin);
app.register(redisPlugin)
app.register(loggerPlugin);
app.register(fastifySensible);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);
app.after(()=>{
  app.chatRepo = new ChatRepository(app.db);
  app.chatService = new ChatService(app.chatRepo);
});
app.register(chatRoute)

const start = async () => {
  try {
    await app.listen({
      port,
      host,
    });
    app.logger.info(`The chat service has been started on port ${host}:${port}.`);
  } catch (error) {
    console.log({
      message: `An issue occurred while running the chat service server:`,
      error,
    });
    startLogError(app, error);
    process.exit(1);
  }
};

start();
