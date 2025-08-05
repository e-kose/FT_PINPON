import { FastifyInstance, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import cookie from '@fastify/cookie';
import * as dotenv from 'dotenv';
import { parseDuration } from '../auth/utils/parseDuration.js';

dotenv.config();

export default fp(async function cookies(app:FastifyInstance) {
	app.register(cookie, {
		secret : process.env.COOKIE_SECRET || 'empty'
	});	
})

export const replyCookie = fp(async (app: FastifyInstance) => {
  app.decorateReply('setRefreshTokenCookie', function(this: FastifyReply, token: string) {
    const maxAge = parseDuration(process.env.REFRESH_EXPIRES_IN || '7d');
    
    return this.setCookie("refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge
    });
  });

  app.decorateReply('clearRefreshTokenCookie', function(this: FastifyReply) {
    return this.clearCookie("refresh_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
  });
});