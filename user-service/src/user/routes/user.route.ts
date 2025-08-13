import { FastifyInstance } from "fastify";
import { createUserHandler } from "../controller/user.controller";

export async function userRoute(app:FastifyInstance) {
	
	app.post("/user", createUserHandler);
}