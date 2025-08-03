import { FastifyInstance } from "fastify";
import { register } from "./auth.controller";


export async function authRoutes(app:FastifyInstance) {
	app.post('/register', register);
}