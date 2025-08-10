import fastify from "fastify";
import * as dotenv from "dotenv";
import sensible from "./plugins/sensible.plugin.js";
import { authRoutes } from "./auth/auth.routes.js";
import errorHandlerPlugin from "./plugins/catchGlobError.plugin.js";
import jwtPlugin from "./plugins/jwt.plugin.js";
import cookiesPlugin, { replyCookie } from "./plugins/cookies.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import OAuthPlugins from "./plugins/OAuth.plugins.js";
import vaultPlugin from "./plugins/vault.plugin.js";

dotenv.config();

const port = +(process.env.PORT || "3001");
const host = process.env.HOST;
const app = fastify({ logger: true ,ajv : {
  customOptions : {removeAdditional : false}
}});

app.register(sensible);
app.register(cookiesPlugin);
app.register(OAuthPlugins);
// app.register(vaultPlugin);
app.register(replyCookie);
app.register(swaggerPlugin);
app.register(jwtPlugin);
app.register(errorHandlerPlugin);
app.register(authRoutes, {prefix : '/auth'});

const start = async () => {
  try {
    await app
      .listen({
        host,
        port,
      })
      .then(() => console.log(`Auth servisi ${port} portunda çalıştı`))
      .catch((err) =>
        console.log({ Message: `Auth servisi başlatılamadı`, err })
      );
  } catch (error) {
	app.log.error(error);
	process.exit(1);
  }
};

start();
