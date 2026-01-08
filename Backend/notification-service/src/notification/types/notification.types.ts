export type NotificationType = 'chat_message';

export interface Notification {
    id: number;
    from_user_id: number;
    to_user_id: number;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateNotificationRequest {
    to_user_id: number;
    title: string;
    message: string;
    type?: NotificationType;
}

export interface UpdateNotificationRequest {
    is_read?: boolean;
    title?: string;
    message?: string;
    type?: NotificationType;
}

export interface NotificationFilters {
    is_read?: boolean;
    type?: NotificationType;
    from_user_id?: number;
    limit?: number;
    offset?: number;
}

export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
}

export interface NotificationResponse {
    success: boolean;
    data?: Notification | Notification[] | NotificationStats;
    message?: string;
    error?: string;
}
