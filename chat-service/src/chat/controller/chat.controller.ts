import type { FastifyReply, FastifyRequest } from "fastify";
import { chatNotFound } from "../errors/chat.errors.js";
import { logError } from "../../utils/log.utils.js";

export const connections = new Map<number, WebSocket>();

export async function conversationHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
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
      const chatService = req.server.chatService;
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

export async function blockUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.blockUser(req);
    console.log("res", res);
    return reply.code(201).send({ success: true, blockId: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function removeBlockUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.removeBlockUser(req);
    return reply.code(200).send({ success: true, affectedRow: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function getBlockedUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.getBlockUser(req);
    return reply.code(200).send({ success: true, blockList: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function inviteUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.inviteUser(req);
    return reply.code(201).send({ success: true, inviteId: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function getInvitesHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.getInvites(req);
    return reply.code(200).send({ success: true, invites: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function notifyHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.sendNotify(req);
    return reply.code(200).send({ success: true, notifyId: res });
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}

export async function getNotifyHandler(req:FastifyRequest, reply :FastifyReply) {
  try {
    const chatService = req.server.chatService;
    const res = await chatService?.getNotify(req);
    return reply.code(200).send({success : true, notifications : res});
  } catch (error) {
    logError(req.server, req, error);
    return reply
      .code(500)
      .send({ success: false, message: "Chat service error" });
  }
}
