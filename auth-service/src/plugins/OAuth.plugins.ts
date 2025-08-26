import fastifyOauth2 from "@fastify/oauth2";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyOauth2, {
     name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION, 
    },
    startRedirectPath: '/auth/google',
    //Caddy kaldırıldğında https yap portu kaldır
    callbackUri: process.env.GOOGLE_CALLBACK_URI || 'http://localhost:3000/auth/google/callback'
  });
});
