import { FastifyInstance } from "fastify";
import { register } from "./auth.controller.js";


export async function authRoutes(app:FastifyInstance) {
	app.post('/register', register);
}