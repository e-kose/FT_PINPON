import "fastify"
import BetterSqlite from 'better-sqlite3'
import type pino from "pino"
import type { MessageRepository } from "../chat/repository/messages.repository"
import type { messageService } from "../chat/service/message.service"
import type Redis from "ioredis"

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

declare module "fastify"{
	interface FastifyInstance{
		messageRepo : MessageRepository | null,
		messageService : messageService | null
	}
}

declare module "fastify"{
	interface FastifyInstance{
		redis : Redis
	}
}