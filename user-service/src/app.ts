import fastify from "fastify";
import * as dotenv from "dotenv";
import { UserRepository } from "./user/repository/user.repository";
import { dbPlug } from './plugins/db.plugin';
import { UserService } from "./user/services/user.service";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin";
import sensiblePlugin from "./plugins/sensible.plugin";

dotenv.config();

const host = process.env.HOST || "localhost";
const port = +(process.env.PORT || "3003");
const app = fastify({ logger: true });

app.register(dbPlug)
app.register(catchGlobErrorPlugin);
app.register(sensiblePlugin);

app.decorate('userRepo', null);
app.decorate('userService', null);

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
