import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../service/notification.service.js';
import {
    CreateNotificationRequest,
    UpdateNotificationRequest,
    NotificationFilters
} from '../types/notification.types.js';

export class NotificationController {
    private notificationService: NotificationService;

    constructor(notificationService: NotificationService) {
        this.notificationService = notificationService;
    }

    private getCurrentUserId(request: FastifyRequest): number {
        const currentUser = +(request.headers["x-user-id"]!);

        if (!currentUser || currentUser <= 0) {
            throw new Error('Invalid or missing user ID in headers');
        }

        return currentUser;
    }

    createNotification = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const data = request.body as CreateNotificationRequest;

            const notification = await this.notificationService.createNotification(currentUserId, data);

            return reply.status(201).send({
                success: true,
                data: notification,
                message: 'Notification created successfully'
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getUserNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const queryFilters = request.query as any;

            const filters: NotificationFilters = {};

            if (queryFilters.type) {
                filters.type = queryFilters.type;
            }

            if (queryFilters.is_read !== undefined) {
                filters.is_read = queryFilters.is_read === 'true';
            }

            if (queryFilters.from_user_id) {
                const fromUserId = parseInt(queryFilters.from_user_id);
                if (!isNaN(fromUserId)) {
                    filters.from_user_id = fromUserId;
                }
            }

            if (queryFilters.limit) {
                const limit = parseInt(queryFilters.limit);
                if (!isNaN(limit)) {
                    filters.limit = limit;
                }
            }

            if (queryFilters.offset) {
                const offset = parseInt(queryFilters.offset);
                if (!isNaN(offset)) {
                    filters.offset = offset;
                }
            }

            const notifications = await this.notificationService.getUserNotifications(currentUserId, filters);

            return reply.send({
                success: true,
                data: notifications,
                message: 'Notifications retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getNotificationById = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const { id } = request.params as { id: number };

            const notification = await this.notificationService.getNotificationById(id, currentUserId);

            if (!notification) {
                return reply.status(404).send({
                    success: false,
                    error: 'Notification not found'
                });
            }

            return reply.send({
                success: true,
                data: notification,
                message: 'Notification retrieved successfully'
            });
        } catch (error: any) {
            const statusCode = error.message.includes('Access denied') ? 403 : 400;
            return reply.status(statusCode).send({
                success: false,
                error: error.message
            });
        }
    };

    updateNotification = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const { id } = request.params as { id: number };
            const data = request.body as UpdateNotificationRequest;

            const notification = await this.notificationService.updateNotification(id, currentUserId, data);

            return reply.send({
                success: true,
                data: notification,
                message: 'Notification updated successfully'
            });
        } catch (error: any) {
            const statusCode = error.message.includes('not found') || error.message.includes('Access denied') ? 404 : 400;
            return reply.status(statusCode).send({
                success: false,
                error: error.message
            });
        }
    };

    markAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const { id } = request.params as { id: number };

            const notification = await this.notificationService.markAsRead(id, currentUserId);

            return reply.send({
                success: true,
                data: notification,
                message: 'Notification marked as read'
            });
        } catch (error: any) {
            const statusCode = error.message.includes('not found') || error.message.includes('Access denied') ? 404 : 400;
            return reply.status(statusCode).send({
                success: false,
                error: error.message
            });
        }
    };

    deleteNotification = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const { id } = request.params as { id: number };

            await this.notificationService.deleteNotification(id, currentUserId);

            return reply.send({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error: any) {
            const statusCode = error.message.includes('not found') || error.message.includes('Access denied') ? 404 : 400;
            return reply.status(statusCode).send({
                success: false,
                error: error.message
            });
        }
    };

    markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const filters = request.body as { type?: string; from_user_id?: number };

            const updatedCount = await this.notificationService.markAllAsRead(currentUserId, filters);

            return reply.send({
                success: true,
                data: { updated_count: updatedCount },
                message: `${updatedCount} notifications marked as read`
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getNotificationStats = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);

            const stats = await this.notificationService.getNotificationStats(currentUserId);

            return reply.send({
                success: true,
                data: stats,
                message: 'Notification statistics retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getUnreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);

            const count = await this.notificationService.getUnreadCount(currentUserId);

            return reply.send({
                success: true,
                data: { unread_count: count },
                message: 'Unread count retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getRecentUnread = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = this.getCurrentUserId(request);
            const { limit } = request.query as { limit?: number };

            const notifications = await this.notificationService.getRecentUnreadNotifications(
                currentUserId,
                limit || 5
            );

            return reply.send({
                success: true,
                data: notifications,
                message: 'Recent unread notifications retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };
}
