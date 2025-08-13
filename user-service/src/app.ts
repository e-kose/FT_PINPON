import fastify from "fastify";
import * as dotenv from "dotenv";
import { UserRepository } from "./user/repository/user.repository";
import {dbPlug} from '../plugins/db.plugin.js';


dotenv.config();

const host = process.env.HOST || "localhost";
const port = +(process.env.PORT || "3003");
const app = fastify({ logger: true });

app.register(dbPl)
app.decorate('userRepo', null);
app.decorate('userService', null);

app.after(() => {

  app.userRepo = new UserRepository()
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
