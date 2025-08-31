import type { FastifyInstance } from "fastify";
import { conversationHandler, sendMessageHandler } from "../controller/message.controller.js";
import { conversationSchema } from "../schemas/conversation.schema.js";

const createSchema = (summary: string, schema: any) => ({
  tags: ["Chat"],
  summary,
  ...schema,
});

export async function chatRoute(app: FastifyInstance) {
  app.get(
    "/chat/conversation/id/:id",
    { schema: createSchema("Chat History", conversationSchema) },
    conversationHandler
  );
  app.get(
    "/chat/ws", {websocket : true}, sendMessageHandler
  )
}
