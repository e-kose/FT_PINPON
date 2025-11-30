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
    fastify.post('/notification', {
        schema: createNotificationSchema,
        handler: controller.createNotification
    });

    // Get user notifications with filters
    fastify.get('/notification', {
        schema: getNotificationsSchema,
        handler: controller.getUserNotifications
    });

    // Get notification by ID
    fastify.get('/notification/:id', {
        schema: getNotificationSchema,
        handler: controller.getNotificationById
    });

    // Update notification
    fastify.put('/notification/:id', {
        schema: updateNotificationSchema,
        handler: controller.updateNotification
    });

    // Mark notification as read
    fastify.patch('/notification/:id/read', {
        schema: getNotificationSchema,
        handler: controller.markAsRead
    });

    // Delete notification
    fastify.delete('/notification/:id', {
        schema: deleteNotificationSchema,
        handler: controller.deleteNotification
    });

    // Mark all notifications as read
    fastify.patch('/notification/mark-all-read', {
        schema: markAllAsReadSchema,
        handler: controller.markAllAsRead
    });

    // Get notification statistics
    fastify.get('/notification/stats', {
        handler: controller.getNotificationStats
    });

    // Get unread notifications count
    fastify.get('/notification/unread-count', {
        handler: controller.getUnreadCount
    });

    // Get recent unread notifications
    fastify.get('/notification/recent-unread', {
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
