import 'fastify'
import { UserService } from '../user/services/user.service';
import { UserRepository } from '../user/repository/user.repository';
import BetterSqlite from 'better-sqlite3'
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