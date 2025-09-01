import type { FastifyInstance } from "fastify";
import {
  blockUserHandler,
  conversationHandler,
  getBlockedUserHandler,
  removeBlockUserHandler,
  sendMessageHandler,
} from "../controller/chat.controller.js";
import { conversationSchema } from "../schemas/conversation.schema.js";
import {
  blockListSchema,
  blockSchema,
  removeBlockSchema,
} from "../schemas/block.schema.js";

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
  app.get("/chat/ws", { websocket: true }, sendMessageHandler);
  app.get(
    "/chat/block",
    { schema: createSchema("Get block list", blockListSchema) },
    getBlockedUserHandler
  );
  app.post(
    "/chat/block",
    { schema: createSchema("Block User", blockSchema) },
    blockUserHandler
  );
  app.delete(
    "/chat/block",
    { schema: createSchema("Remove Block User", removeBlockSchema) },
    removeBlockUserHandler
  );
}
