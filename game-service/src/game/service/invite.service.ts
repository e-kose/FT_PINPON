import type { InviteRepository } from "../repository/invite.repository.js";
import type { GameService } from "./game.service.js";
import type { GameInvite, Game } from "../types/game.types.js";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInviteInput {
  fromUserId: number;
  fromNickname: string;
  toUserId: number;
  toNickname?: string;
  maxScore?: number;
}

export interface InviteAcceptResult {
  invite: GameInvite;
  game: Game;
  notification: {
    type: "GAME_STARTED";
    gameId: string;
    player1: { userId: number; nickname: string; side: "left" };
    player2: { userId: number; nickname: string; side: "right" };
  };
}

// ============================================================================
// INVITE SERVICE
// ============================================================================

export class InviteService {
  constructor(
    private inviteRepo: InviteRepository,
    private gameService: GameService
  ) {}

  /**
   * Create a new game invite
   */
  createInvite(input: CreateInviteInput): GameInvite {
    // Check if there's already a pending invite between these users
    const existingInvites = this.inviteRepo.findPendingByUser(input.toUserId);
    const duplicateInvite = existingInvites.find(
      (inv) => inv.from_user_id === input.fromUserId
    );

    if (duplicateInvite) {
      return duplicateInvite; // Return existing invite instead of creating new
    }

    return this.inviteRepo.create({
      from_user_id: input.fromUserId,
      from_nickname: input.fromNickname,
      to_user_id: input.toUserId,
      to_nickname: input.toNickname,
      max_score: input.maxScore || 11,
    });
  }

  /**
   * Accept an invite and create a game
   */
  acceptInvite(inviteId: string, acceptorUserId: number): InviteAcceptResult {
    const invite = this.inviteRepo.findById(inviteId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error(`Invite is already ${invite.status}`);
    }

    if (invite.to_user_id !== acceptorUserId) {
      throw new Error("You are not the recipient of this invite");
    }

    // Check if invite has expired
    const now = Math.floor(Date.now() / 1000);
    if (invite.expires_at && invite.expires_at < now) {
      this.inviteRepo.updateStatus(inviteId, "expired");
      throw new Error("Invite has expired");
    }

    // Create the game
    const game = this.gameService.createOnlineGame(
      invite.from_user_id,
      invite.from_nickname,
      invite.to_user_id,
      invite.to_nickname || `Player_${invite.to_user_id}`,
      invite.max_score
    );

    // Update invite status
    this.inviteRepo.updateStatus(inviteId, "accepted", game.id);

    // Prepare notification payload
    const notification = {
      type: "GAME_STARTED" as const,
      gameId: game.id,
      player1: {
        userId: invite.from_user_id,
        nickname: invite.from_nickname,
        side: "left" as const,
      },
      player2: {
        userId: invite.to_user_id,
        nickname: invite.to_nickname || `Player_${invite.to_user_id}`,
        side: "right" as const,
      },
    };

    return {
      invite: this.inviteRepo.findById(inviteId)!,
      game,
      notification,
    };
  }

  /**
   * Decline an invite
   */
  declineInvite(inviteId: string, declinerId: number): GameInvite {
    const invite = this.inviteRepo.findById(inviteId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error(`Invite is already ${invite.status}`);
    }

    if (invite.to_user_id !== declinerId) {
      throw new Error("You are not the recipient of this invite");
    }

    this.inviteRepo.updateStatus(inviteId, "declined");
    return this.inviteRepo.findById(inviteId)!;
  }

  /**
   * Cancel an invite (by sender)
   */
  cancelInvite(inviteId: string, cancellerId: number): GameInvite {
    const invite = this.inviteRepo.findById(inviteId);

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error(`Invite is already ${invite.status}`);
    }

    if (invite.from_user_id !== cancellerId) {
      throw new Error("You are not the sender of this invite");
    }

    this.inviteRepo.updateStatus(inviteId, "cancelled");
    return this.inviteRepo.findById(inviteId)!;
  }

  /**
   * Get pending invites for a user
   */
  getPendingInvites(userId: number): GameInvite[] {
    return this.inviteRepo.findPendingByUser(userId);
  }

  /**
   * Get sent invites by a user
   */
  getSentInvites(userId: number): GameInvite[] {
    return this.inviteRepo.findSentByUser(userId);
  }

  /**
   * Get invite by ID
   */
  getInvite(inviteId: string): GameInvite {
    const invite = this.inviteRepo.findById(inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }
    return invite;
  }

  /**
   * Clean up expired invites
   */
  cleanupExpiredInvites(): number {
    return this.inviteRepo.expireOldInvites();
  }
}
