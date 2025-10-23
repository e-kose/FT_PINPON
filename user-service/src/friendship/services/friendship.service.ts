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
    const blocked = this.friendshipRepo.isBlocked(toId, fromId);
    if (blocked) throw new FriendBadRequest('You cannot send a friend request to this user');

    const existingBlock = this.friendshipRepo.isBlocked(fromId, toId);
    if (existingBlock) throw new FriendBadRequest('You cannot send a friend request to this user, because you have blocked them.');

    const existing = this.friendshipRepo.getFriendshipBetween(fromId, toId) as any;
    if (existing) {
      if (existing.status === 'pending') throw new FriendBadRequest('Request already pending');
      if (existing.status === 'accepted') throw new FriendBadRequest('Already friends');
      throw new FriendBadRequest('Cannot create friend request: existing record present');
    }

    return this.friendshipRepo.createRequest(fromId, toId);
  }

  acceptRequest(requestId: number, actorId: number) {
    const req = this.friendshipRepo.getFriendshipById(requestId) as any;
    if (!req) throw new FriendBadRequest('Friend request not found');
    if (req.friend_id !== actorId) throw new FriendBadRequest('Not authorized to accept');
    this.friendshipRepo.updateStatus(requestId, 'accepted');
  }

  rejectRequest(requestId: number, actorId: number) {
    const req = this.friendshipRepo.getFriendshipById(requestId) as any;
    if (!req) throw new FriendBadRequest('Friend request not found');
    if (req.friend_id !== actorId && req.user_id !== actorId) throw new FriendBadRequest('Not authorized to reject');
    return this.friendshipRepo.deleteFriendship(requestId);
  }

  listFriends(userId: number) {
    const rows = this.friendshipRepo.listFriends(userId) as any[];
    return rows.map((r) => {
      const s = this.userRepo.getUserSummaryById(r.friend_id) || {} as any;
      return {
        id: r.id,
        friend_id: r.friend_id,
        friend_username: s.username || null,
        friend_full_name: s.full_name || null,
        friend_avatar_url: s.avatar_url || null,
      };
    });
  }

  // Blocking
  blockUser(blockerId: number, blockedId: number) {
    if (blockerId === blockedId) throw new FriendBadRequest('Cannot block yourself');
    const res = this.friendshipRepo.createBlock(blockerId, blockedId);
    // If there's any existing friendship (pending or accepted), remove it when blocking
    const existing = this.friendshipRepo.getFriendshipBetween(blockerId, blockedId) as any;
    if (existing) {
      this.friendshipRepo.deleteFriendship(existing.id);
    }
    return res;
  }

  getBlockedList(userId: number) {
    const rows = this.friendshipRepo.getBlockedList(userId) as any[];
    return rows.map((r) => {
      const s = this.userRepo.getUserSummaryById(r.id) || {} as any;
      return {
        id: r.id,
        friend_id: r.id,
        friend_username: s.username || r.username || null,
        friend_full_name: s.full_name || null,
        friend_avatar_url: s.avatar_url || null,
      };
    });
  }

  unblockUser(blockerId: number, blockedId: number) {
    return this.friendshipRepo.deleteBlock(blockerId, blockedId);
  }

  // Remove friend relationship
  removeFriend(userId: number, friendId: number) {
    const existing = this.friendshipRepo.getFriendshipBetween(userId, friendId) as any;
    if (!existing) throw new FriendBadRequest('Friendship not found');
    return this.friendshipRepo.deleteFriendship(existing.id);
  }

  listSentRequests(userId: number) {
    const rows = this.friendshipRepo.listSentRequests(userId) as any[];
    return rows.map((r) => {
      const s = this.userRepo.getUserSummaryById(r.friend_id) || {} as any;
      return {
        id: r.id,
        friend_id: r.friend_id,
        friend_username: s.username || null,
        friend_full_name: s.full_name || null,
        friend_avatar_url: s.avatar_url || null,
        status: r.status || null,
      };
    });
  }
  listRequests(userId: number) {
    const rows = this.friendshipRepo.listRequests(userId) as any[];
    return rows.map((r) => {
      const s = this.userRepo.getUserSummaryById(r.user_id) || {} as any;
      return {
        id: r.id,
        friend_id: r.user_id,
        friend_username: s.username || null,
        friend_full_name: s.full_name || null,
        friend_avatar_url: s.avatar_url || null,
        status: r.status || null,
      };
    });
  }

  // Cancel a sent friend request (sender can retract a pending request)
  cancelSentRequest(senderId: number, requestId: number) {
    const req = this.friendshipRepo.getFriendshipById(requestId) as any;
    if (!req) throw new FriendBadRequest('Friend request not found');
    if (req.user_id !== senderId) throw new FriendBadRequest('Not authorized to cancel this request');
    if (req.status !== 'pending') throw new FriendBadRequest('Only pending requests can be canceled');
    return this.friendshipRepo.deleteFriendship(requestId);
  }
}
