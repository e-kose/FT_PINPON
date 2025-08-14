import { FastifyInstance } from "fastify";
import { createUserHandler,getUserByEmail,getUserById,getUserByUsername,login } from "../controller/user.controller.js";

export async function userRoute(app:FastifyInstance) {
	
	app.post("/user", createUserHandler);
	app.post("/login", login);

	app.get("/user/id/:id", getUserById);
	app.get("/user/email/:email", getUserByEmail);
	app.get("/user/username/:username", getUserByUsername);


}