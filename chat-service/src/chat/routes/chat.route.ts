import type { FastifyInstance } from "fastify";
import { conversationHandler } from "../controller/message.controller";
import { conversationSchema } from "../schemas/conversation.schema";

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

}
