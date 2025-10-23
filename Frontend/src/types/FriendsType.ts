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


