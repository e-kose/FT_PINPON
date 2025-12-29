import Database from "better-sqlite3"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"


export default fp( async function dbConfig(app : FastifyInstance){
	const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/auth.db";
	const db = new Database(dbPath);
	app.decorate("db", db);
})