import { NotificationRepository } from '../repository/notification.repository.js';
import { WebSocketManager } from './websocket.service.js';
import {
    Notification,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    NotificationFilters,
    NotificationStats
} from '../types/notification.types.js';

export class NotificationService {
    private notificationRepo: NotificationRepository;
    private webSocketManager?: WebSocketManager;

    constructor(notificationRepo: NotificationRepository, webSocketManager?: WebSocketManager) {
        this.notificationRepo = notificationRepo;
        this.webSocketManager = webSocketManager;
    }

    setWebSocketManager(webSocketManager: WebSocketManager): void {
        this.webSocketManager = webSocketManager;
    }

    async createNotification(fromUserId: number, data: CreateNotificationRequest): Promise<Notification> {
        if (fromUserId === data.to_user_id) {
            throw new Error('Cannot send notification to yourself');
        }

        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        if (!data.message || data.message.trim().length === 0) {
            throw new Error('Message is required');
        }

        if (data.to_user_id <= 0) {
            throw new Error('Invalid recipient user ID');
        }

        const notification = this.notificationRepo.create(fromUserId, {
            ...data,
            title: data.title.trim(),
            message: data.message.trim(),
            type: data.type || 'chat_message'
        });

        if (this.webSocketManager) {
            this.webSocketManager.sendNotificationToUser(data.to_user_id, notification, 'created');
        }

        return notification;
    }

    async getNotificationById(id: number, userId: number): Promise<Notification | null> {
        const notification = this.notificationRepo.findById(id);

        if (!notification) {
            return null;
        }

        if (notification.to_user_id !== userId) {
            throw new Error('Access denied: You can only access your own notifications');
        }

        return notification;
    }

    async getUserNotifications(userId: number, filters: NotificationFilters = {}): Promise<Notification[]> {
        const defaultedFilters = {
            ...filters,
            limit: filters.limit || 20,
            offset: filters.offset || 0
        };

        if (defaultedFilters.limit > 100) {
            defaultedFilters.limit = 100;
        }

        return this.notificationRepo.findByUserId(userId, defaultedFilters);
    }

    async updateNotification(id: number, userId: number, data: UpdateNotificationRequest): Promise<Notification | null> {
        const updatedNotification = this.notificationRepo.update(id, userId, data);

        if (!updatedNotification) {
            throw new Error('Notification not found or access denied');
        }

        if (this.webSocketManager) {
            this.webSocketManager.sendNotificationToUser(userId, updatedNotification, 'updated');
        }

        return updatedNotification;
    }

    async markAsRead(id: number, userId: number): Promise<Notification | null> {
        const notification = await this.updateNotification(id, userId, { is_read: true });

        if (notification && this.webSocketManager) {
            this.webSocketManager.sendNotificationToUser(userId, notification, 'marked_read');
        }

        return notification;
    }

    async deleteNotification(id: number, userId: number): Promise<boolean> {
        const notification = this.notificationRepo.findById(id);

        const deleted = this.notificationRepo.delete(id, userId);

        if (!deleted) {
            throw new Error('Notification not found or access denied');
        }

        if (notification && this.webSocketManager) {
            this.webSocketManager.sendNotificationToUser(userId, notification, 'deleted');
        }

        return true;
    }

    async markAllAsRead(userId: number, filters: { type?: string; from_user_id?: number } = {}): Promise<number> {
        return this.notificationRepo.markAllAsRead(userId, filters);
    }

    async getNotificationStats(userId: number): Promise<NotificationStats> {
        return this.notificationRepo.getStats(userId);
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepo.getUnreadCount(userId);
    }

    async getRecentUnreadNotifications(userId: number, limit: number = 5): Promise<Notification[]> {
        return this.notificationRepo.findByUserId(userId, {
            is_read: false,
            limit,
            offset: 0
        });
    }
}
