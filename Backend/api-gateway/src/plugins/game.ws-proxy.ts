import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import httpProxy from "http-proxy";
import http from "http";

export default fp(async (app: FastifyInstance) => {
	const wsProxy = httpProxy.createProxyServer({
		target: process.env.GAME_SERVICE_URL || "http://localhost:3005",
		ws: true,
	});

	app.server.on("upgrade", async (req, socket, head) => {
		if (req.url?.startsWith("/game/ws")) {
			try {
				const user = await app.wsJwtAuth(req as http.IncomingMessage);
				req.headers["x-user-id"] = user.id;
				req.headers["x-user-email"] = user.email;
				req.headers["x-user-username"] = user.username;
				wsProxy.ws(req, socket, head);
			} catch (err) {
				app.log.error(err, "WebSocket Auth Error");
				socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
				socket.destroy();
			}
		}
	});

	wsProxy.on('error', (err, req, socket) => {
		app.log.error(err, "WebSocket Proxy Error");
		if (socket && !socket.destroyed) {
			socket.end();
		}
	});
});
