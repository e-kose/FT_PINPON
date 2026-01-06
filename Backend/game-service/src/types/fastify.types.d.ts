import "fastify"
import type BetterSqlite from 'better-sqlite3'
import type pino from "pino"

declare module "fastify"{
	interface FastifyInstance{
		db: BetterSqlite
	}
}

declare module "fastify"{
	interface FastifyInstance{
		logger : pino.Logger
	}
}
