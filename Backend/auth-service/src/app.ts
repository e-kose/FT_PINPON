import fastify from "fastify";
import * as dotenv from "dotenv";
import { authRoutes } from "./auth/auth.routes.js";
import errorHandlerPlugin from "./plugins/catchGlobError.plugin.js";
import jwtPlugin from "./plugins/jwt.plugin.js";
import cookiesPlugin, { replyCookie } from "./plugins/cookies.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import OAuthPlugins from "./plugins/OAuth.plugins.js";
import { dbPlug } from "./plugins/db.plugin.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./auth/utils/log.utils.js";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const port = +(process.env.PORT || "3001");
const host = process.env.HOST || "0.0.0.0";
const app = fastify({
  logger: true,
  ajv: {
    customOptions: { removeAdditional: false },
  },
});

app.register(loggerPlugin);
app.register(sensiblePlugin);
app.register(dbPlug);
app.register(cookiesPlugin);
app.register(OAuthPlugins);
// app.register(vaultPlugin);
app.register(replyCookie);
app.register(swaggerPlugin);
app.register(jwtPlugin);
app.register(errorHandlerPlugin);

// Static file server for default avatar
app.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
<<<<<<< HEAD:Backend/auth-service/src/app.ts
  prefix: "/static/",
=======
  prefix: "/auth/static/",
>>>>>>> origin/main:auth-service/src/app.ts
});

app.register(authRoutes, { prefix: "/auth" });

const start = async () => {
  try {
    await app
      .listen({
        host,
        port,
      })
      app.logger.info(`The auth service has been started on port ${host}:${port}.`)
  } catch (error: any) {
    app.logger.error(error)
    startLogError(app, error)
    process.exit(1);
  }
};

start();
