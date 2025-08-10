import Fastify from "fastify";
import * as dotenv from 'dotenv';
import proxy from '@fastify/http-proxy'
dotenv.config();

const app = Fastify({ logger: true });
const port: number = +(process.env.PORT || "3000");


app.register(proxy, {
    upstream : process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    prefix: "/auth/",
    rewritePrefix : '/auth/'
});

const start = async () => {
  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Api-gateway ${port} portunda çalıştı`);
  } catch (error) {
    console.log({
      message: "Api gateway sunucusu çalıştırılırken sorun oluştu:",
      error,
    });
    process.exit(1);
  }
};

start();