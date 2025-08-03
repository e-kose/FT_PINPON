import fastify from "fastify";
import * as dotenv from "dotenv";

dotenv.config();

const port = +(process.env.PORT || "3001");
const host = process.env.HOST;
const app = fastify({ logger: true });

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
