import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import * as dotenv from "dotenv";

dotenv.config();

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Notification Service API",
        description: "Notification service documentation",
        version: "1.0.0",
      },
      servers: [
        {
          url: process.env.SWAGGER_SERVER_URL || "http://localhost:3004",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/notification/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    staticCSP: true,
  });
});
