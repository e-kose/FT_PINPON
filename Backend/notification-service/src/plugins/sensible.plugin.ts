import fp from 'fastify-plugin';
import FastifySensible from '@fastify/sensible'
import { FastifyInstance } from 'fastify'

export default fp(async function sensible(app: FastifyInstance) {
	app.register(FastifySensible);
})
