import type { FastifyRequest } from "fastify";
import type { MessageRepository } from "../repository/messages.repository";
import type { CreateMessage } from "../types/createMessage.type";
import type { userParam } from "../types/params.types";
import axios from "axios";
import { chatNotFound } from "../errors/chat.errors";

const userService = process.env.USER_SERVICE || "http://localhost:3002";
const DEFAULT_AVATAR = process.env.R2_PUBLIC_URL + "/default-profile.png";

export class messageService {
  messageRepo: MessageRepository;
  constructor(messageRepo: MessageRepository) {
    this.messageRepo = messageRepo;
  }

  async getConversation(req: FastifyRequest) {
    const currentUser = +req.headers["x-user-id"]!;

    const othetUser = +(req.params as userParam).id;
    const offset = +((req.query as any).offset ?? 0);
    const limit = +((req.query as any).limit ?? 50);
    const messages = this.messageRepo.getConversation(
      currentUser,
      othetUser,
      limit,
      offset
    );
    if (!messages.length) throw new chatNotFound();
    const users: { [key: number]: any } = {};
    const uniqUserId = [
      ...new Set(messages.flatMap((m: any) => [m.sender_id, m.recv_id])),
    ];
    for (const id of uniqUserId) {
      try {
        const res = (await axios(userService + `/user/id/${id}`)).data;
        users[id] = {
          id: res.user.id,
          username: res.user.username,
          avatar_url: res.user.profile.avatar_url,
        };
      } catch (error) {
        users[id] = { id, username: "user", avatar_url: DEFAULT_AVATAR };
      }
    }
    return messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      sender: users[msg.sender_id],
      receiver: users[msg.recv_id],
    }));
  }
}
