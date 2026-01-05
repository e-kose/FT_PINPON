import type { UserOnlineStatus } from './NotificationTypes';

export type Friend = {
  id: number;
  friend_id: number;
  friend_username: string;
  friend_full_name?: string;
  friend_avatar_url: string;
};

export type BlockedUser = {
  id: number;
  friend_id: number;
  friend_username: string;
  friend_full_name?: string;
  friend_avatar_url: string;
};

export type SentRequest = {
  id: number;
  friend_id: number;
  friend_username: string;
  friend_full_name?: string;
  friend_avatar_url: string;
  status: string;
};

export type ReceivedRequest = {
  id: number;
  friend_id: number;
  friend_username: string;
  friend_full_name?: string;
  friend_avatar_url: string;
  status: string;
};


type FriendProfileDetail={
  full_name: string;
  avatar_url: string;
  bio: string;
}
export type FriendProfile = {
    id: number;
    email: string;
    username: string;
    created_at: string;
    profile: FriendProfileDetail;
    status?: UserOnlineStatus;
};

