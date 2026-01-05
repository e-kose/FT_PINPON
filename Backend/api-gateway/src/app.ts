import Fastify from "fastify";
import * as dotenv from "dotenv";
import jwtPlugin from "./plugins/jwt.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import proxyPlugin from "./plugins/proxy.plugin.js";
import wsProxy from "./plugins/ws-proxy.js";
import notificationWsProxy from "./plugins/notification.ws-proxy.js";

dotenv.config();

const app = Fastify({ logger: true, trustProxy: true });
const port: number = +(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";

app.register(import('@fastify/cors'), {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
});

app.get('/health', async () => {
  return { status: 'ok' };
});

app.register(jwtPlugin);
app.register(loggerPlugin);
app.register(proxyPlugin);
app.register(wsProxy);
app.register(notificationWsProxy);


const start = async () => {
  try {
    await app.listen({ port, host });
    app.logger.info(
      `The api gateway has been started on port ${host}:${port}.`
    );
  } catch (error: any) {
    console.log({
      message: "An issue occurred while running the API gateway server:",
      error,
    });
    startLogError(app, error);
    process.exit(1);
  }
};

start();
