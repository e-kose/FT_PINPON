import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

export default fp(async(app:FastifyInstance)=>{
	const redis = new Redis({
		host : process.env.REDIS_HOST || "localhost",
		port : +(process.env.REDIS_PORT || "6379"),
	});
	app.decorate("redis", redis);

})