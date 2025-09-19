import "fastify"
import BetterSqlite from 'better-sqlite3'
import type pino from "pino"
import type { ChatRepository } from "../chat/repository/chat.repository"
import type { ChatService } from "../chat/service/chat.service"
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
		chatRepo : ChatRepository | null,
		chatService : ChatService | null
	}
}

declare module "fastify"{
	interface FastifyInstance{
		redis : Redis
	}
}