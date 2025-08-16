import 'fastify'
import { UserService } from '../user/services/user.service';
import { UserRepository } from '../user/repository/user.repository';
import BetterSqlite from 'better-sqlite3'
import { S3Client } from '@aws-sdk/client-s3';
declare module 'fastify' {
  interface FastifyInstance {
	userRepo: UserRepository | null;
	userService: UserService | null;
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