import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'

export const dbPlug = fp(async (app : FastifyInstance) => {
	const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/auth.db"
	const db = new Database(dbPath);
	app.decorate('db', db);
})