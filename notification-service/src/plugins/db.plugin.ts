import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'

export const dbPlug = fp(async (app : FastifyInstance) => {
	const dbPath = process.env.DB_PATH || './db/notifications.db';
	const db = new Database(dbPath);
	app.decorate('db', db);
})
