import 'fastify'
import BetterSqlite from 'better-sqlite3'
import { S3Client } from '@aws-sdk/client-s3';
import { NotificationRepository } from '../notification/repository/notification.repository.js';
import { NotificationService } from '../notification/service/notification.service.js';
import { WebSocketManager } from '../notification/service/websocket.service.js';

declare module "fastify" {
  interface FastifyInstance {
	notificationRepo: NotificationRepository;
	notificationService: NotificationService;
	webSocketManager: WebSocketManager;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    db: BetterSqlite;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    r2 : S3Client
  }
}

declare module "fastify" {
  interface FastifyInstance {
    logger : pino.Logger
  }
}
