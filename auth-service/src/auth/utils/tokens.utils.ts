import { FastifyInstance } from "fastify";
import { payload } from "../types/payload";

export async function genarateTokens(app: FastifyInstance, payload:payload) {
	const jwt_expires = process.env.JWT_EXPIRES_IN;
	const accestoken = await app.jwt.sign(payload, {expiresIn : jwt_expires});
	return {accestoken};
}