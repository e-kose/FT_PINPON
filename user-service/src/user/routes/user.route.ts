import { FastifyInstance } from "fastify";
import { createUserHandler, login } from "../controller/user.controller.js";

export async function userRoute(app:FastifyInstance) {
	
	app.post("/user", createUserHandler);
	app.post("/login", login);
}