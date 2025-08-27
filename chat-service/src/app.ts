import { fastify } from "fastify";
import * as dotenv from "dotenv";
import dbPlugin from "./plugins/db.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./utils/log.utils.js";
import fastifySensible from "@fastify/sensible";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";

dotenv.config();
const port = +(process.env.PORT || "3003");
const host = process.env.HOST || "0.0.0.0";

const app = fastify({ logger: true });

app.register(dbPlugin);
app.register(loggerPlugin);
app.register(fastifySensible);
app.register(catchGlobErrorPlugin);


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
