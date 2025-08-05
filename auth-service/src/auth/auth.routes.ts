import { FastifyInstance } from "fastify";
import { login, register } from "./auth.controller.js";
import { registerUserSchema } from "./schemas/register.userSchema.js";
import { loginUserSchema } from "./schemas/login.userSchema.js";


export async function authRoutes(app:FastifyInstance) {
	app.post('/register',{schema : {body: registerUserSchema}}, register);
	app.post('/login',{schema : {body : loginUserSchema}}, login);
	app.post('/refresh-token', refreshToken);
}