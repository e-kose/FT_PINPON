import type { FastifyReply, FastifyRequest } from "fastify";
import { chatNotFound } from "../errors/chat.errors";
import { logError } from "../../utils/log.utils";

export async function conversationHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
	const chatService = req.server.messageService;
	const res = await chatService?.getConversation(req);
	return reply.code(200).send({success:true, chat: res});
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
