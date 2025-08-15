import fastify from "fastify";
import * as dotenv from "dotenv";
import { UserRepository } from "./user/repository/user.repository.js";
import { dbPlug } from './plugins/db.plugin.js';
import { UserService } from "./user/services/user.service.js";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import { userRoute } from "./user/routes/user.route.js";
import internalAuthPlugin from "./plugins/internalAuth.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";

dotenv.config();

const host = process.env.HOST || "localhost";
const port = +(process.env.PORT || "3003");
const app = fastify({ logger: true });

app.register(sensiblePlugin);
app.register(dbPlug);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);
app.register(internalAuthPlugin);

app.decorate('userRepo', null);
app.decorate('userService', null);

app.register(userRoute)
app.after(() => {
  app.userRepo = new UserRepository(app.db);
  app.userService = new UserService(app.userRepo);
})

const start = async () => {
  try {
    await app
      .listen({
        host,
        port,
      })
      .then(() => console.log(`User servis ${host}:${port} portunda başlatıldı.`))
      .catch((err) =>
        console.log({ Message: `User servisi başlatılamadı`, err })
      );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
