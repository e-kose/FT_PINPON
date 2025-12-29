import fastify from "fastify";
import * as dotenv from "dotenv";
import { UserRepository } from "./user/repository/user.repository.js";
import { dbPlug } from "./plugins/db.plugin.js";
import { UserService } from "./user/services/user.service.js";
import catchGlobErrorPlugin from "./plugins/catchGlobError.plugin.js";
import sensiblePlugin from "./plugins/sensible.plugin.js";
import { userRoute } from "./user/routes/user.route.js";
import { friendshipRoute } from "./friendship/routes/friendship.route.js";
import { FriendshipRepository } from "./friendship/repository/friendship.repository.js";
import { FriendshipService } from "./friendship/services/friendship.service.js";
import internalAuthPlugin from "./plugins/internalAuth.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import multipart from "@fastify/multipart";
import r2Plugin from "./plugins/r2.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import { startLogError } from "./user/utils/log.utils.js";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const host = process.env.HOST || "localhost";
const port = +(process.env.PORT || "3002");
const app = fastify({ logger: true });

app.register(loggerPlugin);
app.register(sensiblePlugin);
app.register(multipart);
app.register(r2Plugin);
app.register(dbPlug);
app.register(swaggerPlugin);
app.register(catchGlobErrorPlugin);
app.register(internalAuthPlugin);

// Static file server for avatars
app.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
<<<<<<< HEAD:Backend/user-service/src/app.ts
  prefix: "/static/",
=======
  prefix: "/user/static/",
>>>>>>> origin/main:user-service/src/app.ts
});

app.decorate("userRepo", null);
app.decorate("userService", null);
app.decorate("friendshipRepo", null);
app.decorate("friendshipService", null);

app.register(userRoute);
app.after(() => {
  app.userRepo = new UserRepository(app.db);
  app.userService = new UserService(app.userRepo);
  (app as any).friendshipRepo = new FriendshipRepository(app.db);
<<<<<<< HEAD:Backend/user-service/src/app.ts
  (app as any).friendshipService = new FriendshipService((app as any).friendshipRepo, (app as any).userRepo);
=======
  (app as any).friendshipService = new FriendshipService(
    (app as any).friendshipRepo,
    (app as any).userRepo
  );
>>>>>>> origin/main:user-service/src/app.ts
});
app.register(friendshipRoute);

const start = async () => {
  try {
    await app.listen({
      host,
      port,
    });
    app.logger.info(
      `The user service has been started on port ${host}:${port}.`
    );
  } catch (error: any) {
    startLogError(app, error);
    process.exit(1);
  }
};

start();
