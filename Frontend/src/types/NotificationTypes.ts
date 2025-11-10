// Notification type definitions

export type NotificationType = 'game_invite' | 'chat_message' | 'friend_request';

export type Notification = {
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

export type NotificationStats = {
  total: number;
  unread: number;
  read: number;
};

export type UserOnlineStatus = {
  userId: number;
  isOnline: boolean;
  timestamp?: string;
};

export type OnlineStatusResponse = {
  onlineStatus: UserOnlineStatus[];
  timestamp: string;
};

export type CreateNotificationPayload = {
  to_user_id: number;
  title: string;
  message: string;
  type?: NotificationType;
};

export type UpdateNotificationPayload = {
  is_read?: boolean;
  title?: string;
  message?: string;
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

// WebSocket message types
export type WebSocketMessage = {
  type: 'notification' | 'success' | 'error' | 'user_status' | 'ping' | 'pong';
  data: any;
  timestamp: string;
};

export type NotificationWebSocketMessage = {
  type: 'notification';
  data: {
    notification: Notification;
    action: 'created' | 'updated' | 'deleted' | 'marked_read' | 'marked_unread';
  };
  timestamp: string;
};

export type UserStatusWebSocketMessage = {
  type: 'user_status';
  data: {
    userId: number;
    status: 'online' | 'offline';
    timestamp: string;
  };
};

export type SuccessWebSocketMessage = {
  type: 'success';
  data: {
    message: string;
    payload?: any;
  };
  timestamp: string;
};

export type ErrorWebSocketMessage = {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
  timestamp: string;
};

// API Response types
export type NotificationResponse<T = any> = {
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
export type NotificationStatsResponse = NotificationResponse<NotificationStats>;
export type UnreadCountResponse = NotificationResponse<{ unread_count: number }>;
export type OnlineUsersResponse = NotificationResponse<{ onlineUsers: number[]; count: number; timestamp: string }>;
export type MultipleOnlineStatusResponse = NotificationResponse<OnlineStatusResponse>;
export type MarkAllReadResponse = NotificationResponse<{ updated_count: number }>;
