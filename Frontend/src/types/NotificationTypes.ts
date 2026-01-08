// Notification type definitions

type NotificationType = 'game_invite' | 'chat_message' | 'friend_request';

type Notification = {
  id: number;
  from_user_id: number;
  to_user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type UserOnlineStatus = {
  userId: number;
  isOnline: boolean;
  timestamp?: string;
};

type OnlineStatusResponse = {
  onlineStatus: UserOnlineStatus[];
  timestamp: string;
};

export type CreateNotificationPayload = {
  to_user_id: number;
  title: string;
  message: string;
  type?: NotificationType;
};

export type NotificationFilters = {
  is_read?: boolean;
  type?: NotificationType;
  from_user_id?: number;
  limit?: number;
  offset?: number;
};

export type MarkAllReadFilters = {
  type?: NotificationType;
  from_user_id?: number;
};

// API Response types
type NotificationResponse<T = any> = {
  status: number;
  ok: boolean;
  data: {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  };
};

export type NotificationListResponse = NotificationResponse<Notification[]>;
export type SingleNotificationResponse = NotificationResponse<Notification>;
export type MultipleOnlineStatusResponse = NotificationResponse<OnlineStatusResponse>;
export type MarkAllReadResponse = NotificationResponse<{ updated_count: number }>;
