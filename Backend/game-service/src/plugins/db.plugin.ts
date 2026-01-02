import Database from "better-sqlite3"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import fs from "fs"
import path from "path"

export default fp(async function dbConfig(app: FastifyInstance) {
	const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/game.db";

	const dir = path.dirname(dbPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const db = new Database(dbPath);
	app.decorate("db", db);
})
