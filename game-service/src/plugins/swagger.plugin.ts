import fastifyPlugin from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Game Service API",
        description: "Pong game service - local, online and tournament modes",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:",
          description: "Development server",
        },
      ],
      tags: [
        { name: "game", description: "Game endpoints" },
        { name: "matchmaking", description: "Matchmaking endpoints" },
        { name: "stats", description: "Statistics endpoints" },
        { name: "tournament", description: "Tournament endpoints" },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/game/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
});
