import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import httpProxy from "http-proxy";
import http from "http";

export default fp(async (app: FastifyInstance) => {
  const wsProxy = httpProxy.createProxyServer({
    target: process.env.CHAT_SERVICE_URL || "http://localhost:3003",
    ws: true,
  });

  app.server.on("upgrade", async (req, socket, head) => {
    if (req.url?.startsWith("/chat/ws")) {
      try {
        const user = await app.wsJwtAuth(req as http.IncomingMessage);
        req.headers["x-user-id"] = user.id;
        req.headers["x-user-email"] = user.email;
        wsProxy.ws(req, socket, head);
      } catch (err) {
        console.log(err);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
      }
    }
  });
});
