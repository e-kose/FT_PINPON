import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'

export const dbPlug = fp(async (app : FastifyInstance) => {
	const db = new Database('./db/auth.db');
	app.decorate('db', db);
})