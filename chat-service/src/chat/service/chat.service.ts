import type { FastifyRequest } from "fastify";
import type { ChatRepository } from "../repository/chat.repository";
import type { CreateMessage } from "../types/createMessage.type";
import type { userParam } from "../types/params.types";
import { chatNotFound } from "../errors/chat.errors.js";
import { UserCache } from "./cache.service.js";
import { connections } from "../controller/chat.controller";

const DEFAULT_AVATAR = process.env.R2_PUBLIC_URL + "/default-profile.png";
export class ChatService {
  messageRepo: ChatRepository;
  constructor(messageRepo: ChatRepository) {
    this.messageRepo = messageRepo;
  }

  async getConversation(req: FastifyRequest) {
    const userCache = new UserCache(req.server);
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
        const res = await userCache.getUser(id);
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

  async sendMessage(req: FastifyRequest, data: any) {
    const currentUser = +req.headers["x-user-id"]!;
    const othetUser = +data.recv_id;
    const isBlocked = this.messageRepo.getBlockBetweenTwoUser(currentUser, othetUser);
    if(isBlocked) return ;
    const receiverConn = connections.get(+data.recv_id);
    if(receiverConn){
      receiverConn.send(JSON.stringify({
        from : currentUser,
        content : data.content
      }))
    }

    const message: CreateMessage = {
      sender_id: currentUser,
      recv_id: othetUser,
      content: data.content as string,
    };
    this.messageRepo.createMessage(message);
  }

  async blockUser(req : FastifyRequest){
    const currentUser = +(req.headers["x-user-id"]!);
    const blockedUser = (req.body as any).blocked_user_id;
    const isExist = this.messageRepo.getBlockUserOne(currentUser, blockedUser);
    if(!isExist){
      const res = this.messageRepo.createBlock(currentUser, blockedUser);
      return res;
    }
    return (isExist as any).id;
  }

  async removeBlockUser(req : FastifyRequest){
    const currentUser = +(req.headers["x-user-id"]!);
    const blockedUser = (req.body as any).blocked_user_id;
    const isExist = this.messageRepo.getBlockUserOne(currentUser, blockedUser);
    if(isExist){
      const res = this.messageRepo.deleteBlock(currentUser, blockedUser);
      return res;
    }
    return 0;
  }

  async getBlockUser(req : FastifyRequest){
    const currentUser = +(req.headers["x-user-id"]!);
    const res = this.messageRepo.getBlockUserList(currentUser);
    return res;
  }
}
