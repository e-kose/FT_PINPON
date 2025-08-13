import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
	userRepo: UserRepository | null;
	userService: any;
  }
}