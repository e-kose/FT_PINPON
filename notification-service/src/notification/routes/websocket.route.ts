import { FastifyInstance } from 'fastify';
import { WebSocketController } from '../controller/websocket.controller.js';

export async function webSocketRoutes(fastify: FastifyInstance) {
    const controller = new WebSocketController(fastify.webSocketManager);

    // WebSocket connection endpoint
    fastify.register(async function (fastify) {
        fastify.get('/notification/ws', { websocket: true }, controller.handleConnection);
    });

    // REST endpoints for WebSocket management
    fastify.get('/notification/ws/stats', {
        handler: controller.getStats
    });

    fastify.get('/notification/ws/online-users', {
        handler: controller.getAllOnlineUsers
    });

    fastify.get('/notification/ws/user/:userId/online', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'number', minimum: 1 }
                }
            }
        },
        handler: controller.checkUserOnlineStatus
    });

    // Check multiple users online status (for friends list)
    fastify.post('/notification/ws/users/online-status', {
        schema: {
            body: {
                type: 'object',
                required: ['userIds'],
                properties: {
                    userIds: {
                        type: 'array',
                        items: { type: 'number', minimum: 1 },
                        minItems: 1,
                        maxItems: 100
                    }
                }
            }
        },
        handler: controller.checkMultipleUsersOnlineStatus
    });
}
