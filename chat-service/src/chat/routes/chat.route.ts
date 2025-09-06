import type { FastifyInstance } from "fastify";
import {
  blockUserHandler,
  conversationHandler,
  getBlockedUserHandler,
  getInvitesHandler,
  getNotifyHandler,
  inviteUserHandler,
  notifyHandler,
  removeBlockUserHandler,
  sendMessageHandler,
} from "../controller/chat.controller.js";
import { conversationSchema } from "../schemas/conversation.schema.js";
import {
  blockListSchema,
  blockSchema,
  removeBlockSchema,
} from "../schemas/block.schema.js";
import { getInvitesSchema, inviteSchema } from "../schemas/invite.schema.js";
import { getNotifySchema, notifySchema } from "../schemas/notify.schema.js";

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
  app.post(
    "/chat/invite",
    { schema: createSchema("Invite user", inviteSchema) },
    inviteUserHandler
  );
  app.get(
    "/chat/invites",
    { schema: createSchema("Get invites", getInvitesSchema) },
    getInvitesHandler
  );
  app.post(
    "/chat/notify-tournament",
    { schema: createSchema("Send notify", notifySchema) },
    notifyHandler
  );
  app.get(
    "/chat/notify",
    { schema: createSchema("Get notifications", getNotifySchema) },
    getNotifyHandler
  );
}
