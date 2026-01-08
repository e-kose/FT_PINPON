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

    fastify.post('/notification', {
        schema: createNotificationSchema,
        handler: controller.createNotification
    });

    fastify.get('/notification', {
        schema: getNotificationsSchema,
        handler: controller.getUserNotifications
    });

    fastify.get('/notification/:id', {
        schema: getNotificationSchema,
        handler: controller.getNotificationById
    });

    fastify.put('/notification/:id', {
        schema: updateNotificationSchema,
        handler: controller.updateNotification
    });

    fastify.patch('/notification/:id/read', {
        schema: getNotificationSchema,
        handler: controller.markAsRead
    });

    fastify.delete('/notification/:id', {
        schema: deleteNotificationSchema,
        handler: controller.deleteNotification
    });

    fastify.patch('/notification/mark-all-read', {
        schema: markAllAsReadSchema,
        handler: controller.markAllAsRead
    });

    fastify.get('/notification/stats', {
        handler: controller.getNotificationStats
    });

    fastify.get('/notification/unread-count', {
        handler: controller.getUnreadCount
    });

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
