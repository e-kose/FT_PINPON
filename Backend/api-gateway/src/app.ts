import Fastify from "fastify";
import * as dotenv from "dotenv";
import jwtPlugin from "./plugins/jwt.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import proxyPlugin from "./plugins/proxy.plugin.js";
import wsProxy from "./plugins/ws-proxy.js";

dotenv.config();

const app = Fastify({ logger: true });
const port: number = +(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";

app.register(import('@fastify/cors'), {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Kendi portun
    'http://127.0.0.1:5173', // Alternatif localhost
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

app.register(jwtPlugin);
app.register(loggerPlugin);
app.register(proxyPlugin);
app.register(wsProxy);

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