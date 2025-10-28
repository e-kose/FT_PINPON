import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controller/notification.controller.js';
import {
    createNotificationSchema,
    updateNotificationSchema,
    getNotificationSchema,
    deleteNotificationSchema,
    getNotificationsSchema,
    markAllAsReadSchema
} from '../schemas/notification.schemas.js';

export async function notificationRoutes(fastify: FastifyInstance) {
    const controller = new NotificationController(fastify.notificationService);

    // Create notification
    fastify.post('/notifications', {
        schema: createNotificationSchema,
        handler: controller.createNotification
    });

    // Get user notifications with filters
    fastify.get('/notifications', {
        schema: getNotificationsSchema,
        handler: controller.getUserNotifications
    });

    // Get notification by ID
    fastify.get('/notifications/:id', {
        schema: getNotificationSchema,
        handler: controller.getNotificationById
    });

    // Update notification
    fastify.put('/notifications/:id', {
        schema: updateNotificationSchema,
        handler: controller.updateNotification
    });

    // Mark notification as read
    fastify.patch('/notifications/:id/read', {
        schema: getNotificationSchema,
        handler: controller.markAsRead
    });

    // Delete notification
    fastify.delete('/notifications/:id', {
        schema: deleteNotificationSchema,
        handler: controller.deleteNotification
    });

    // Mark all notifications as read
    fastify.patch('/notifications/mark-all-read', {
        schema: markAllAsReadSchema,
        handler: controller.markAllAsRead
    });

    // Get notification statistics
    fastify.get('/notifications/stats', {
        handler: controller.getNotificationStats
    });

    // Get unread notifications count
    fastify.get('/notifications/unread-count', {
        handler: controller.getUnreadCount
    });

    // Get recent unread notifications
    fastify.get('/notifications/recent-unread', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'number', minimum: 1, maximum: 20, default: 5 }
                }
            }
        },
        handler: controller.getRecentUnread
    });
}
