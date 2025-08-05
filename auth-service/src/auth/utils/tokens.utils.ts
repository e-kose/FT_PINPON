import { FastifyInstance } from "fastify";
import { payload } from "../types/payload";

export async function genarateTokens(app: FastifyInstance, payload:payload) {
	const jwt_expires = process.env.JWT_EXPIRES_IN;
	const refresh_expires = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
	
	const [accesstoken, refreshtoken] = await Promise.all([
		app.jwt.sign(payload, {expiresIn: jwt_expires}),
		app.jwt.sign(payload, {expiresIn: refresh_expires})
	]);
	
	return {accesstoken, refreshtoken};
}