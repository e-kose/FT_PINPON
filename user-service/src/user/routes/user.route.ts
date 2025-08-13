import { FastifyInstance } from "fastify";

export async function userRoute(app:FastifyInstance) {
	
	app.post("/user", createUserHandler);
}