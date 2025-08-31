import type { FastifyReply, FastifyRequest } from "fastify";
import { chatNotFound } from "../errors/chat.errors.js";
import { logError } from "../../utils/log.utils.js";

export const connections = new Map<number, WebSocket>();

export async function conversationHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.messageService;
    const res = await chatService?.getConversation(req);
    return reply.code(200).send({ success: true, chat: res });
  } catch (err) {
    logError(req.server, req, err);
    if (err instanceof chatNotFound)
      return reply
        .code(err.statusCode)
        .send({ success: false, message: err.message });
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function sendMessageHandler(connection: any, req: FastifyRequest) {
  const currentUser = +req.headers["x-user-id"]!;
  connections.set(currentUser, connection);
  connection.on("message", async (message: any) => {
    try {
      const chatService = req.server.messageService;
      const data = await JSON.parse(message);
      await chatService?.sendMessage(req, data);
    } catch (error: any) {
      logError(req.server, req, error);
      connection.send(
        JSON.stringify({
          success: false,
          error: error?.message || "The message could not be sent.",
        })
      );
    }
  });
  connection.on("close", () => {
    connections.delete(currentUser);
  });
}
