import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import cookie from '@fastify/cookie';
import * as dotenv from 'dotenv';

dotenv.config();

export default fp(async function cookies(app:FastifyInstance) {
	app.register(cookie, {
		secret : process.env.COOKIE_SECRET || 'empty'
	});	
})