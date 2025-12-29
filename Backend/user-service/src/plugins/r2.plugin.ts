import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import * as dotenv from "dotenv";
import { S3 } from "@aws-sdk/client-s3";

dotenv.config();
export default fp(async (app: FastifyInstance) => {
  const r2 = new S3({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });
  app.decorate('r2', r2);
});
