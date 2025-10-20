import { FriendshipRepository } from "../repository/friendship.repository.js";
import { UserRepository } from "../../user/repository/user.repository.js";
import {
  BadRequest as FriendBadRequest,
} from "../../user/errors/user.errors.js";

export class FriendshipService {
  private friendshipRepo: FriendshipRepository;
  private userRepo: UserRepository;

  constructor(friendshipRepo: FriendshipRepository, userRepo: UserRepository) {
    this.friendshipRepo = friendshipRepo;
    this.userRepo = userRepo;
  }

  sendRequest(fromId: number, toId: number) {
    if (fromId === toId) throw new FriendBadRequest('Cannot friend yourself');
    const user = this.userRepo.getUserById(toId);
    if (!user) throw new FriendBadRequest('Target user not found');

    const existing = this.friendshipRepo.getFriendshipBetween(fromId, toId) as any;
    if (existing) {
      if (existing.status === 'pending') throw new FriendBadRequest('Request already pending');
      if (existing.status === 'accepted') throw new FriendBadRequest('Already friends');
    }

    return this.friendshipRepo.createRequest(fromId, toId);
  }

  acceptRequest(requestId: number, actorId: number) {
  const req = this.friendshipRepo.db.prepare("SELECT * FROM friendships WHERE id = ?").get(requestId) as any;
    if (!req) throw new FriendBadRequest('Friend request not found');
    if (req.friend_id !== actorId) throw new FriendBadRequest('Not authorized to accept');
    return this.friendshipRepo.updateStatus(requestId, 'accepted');
  }

  rejectRequest(requestId: number, actorId: number) {
  const req = this.friendshipRepo.db.prepare("SELECT * FROM friendships WHERE id = ?").get(requestId) as any;
  if (!req) throw new FriendBadRequest('Friend request not found');
  if (req.friend_id !== actorId && req.user_id !== actorId) throw new FriendBadRequest('Not authorized to reject');
    return this.friendshipRepo.updateStatus(requestId, 'rejected');
  }

  listFriends(userId: number) {
    return this.friendshipRepo.listFriends(userId);
  }

  listRequests(userId: number) {
    return this.friendshipRepo.listRequests(userId);
  }
}
