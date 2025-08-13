import 'fastify'
import BetterSqlite from 'better-sqlite3'
declare module 'fastify' {
  interface FastifyInstance {
	userRepo: UserRepository | null;
	userService: UserService | null;
  }
}
import "fastify";
import { UserService } from '../user/services/user.service';

declare module "fastify" {
  interface FastifyInstance {
    db: BetterSqlite;
  }
}