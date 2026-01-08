import { FastifyRequest, FastifyReply } from 'fastify';
import { WebSocketManager } from '../service/websocket.service.js';

export class WebSocketController {
    private webSocketManager: WebSocketManager;

    constructor(webSocketManager: WebSocketManager) {
        this.webSocketManager = webSocketManager;
    }

    private generateConnectionId(): string {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    handleConnection = async (connection: any, request: FastifyRequest) => {
        const connectionId = this.generateConnectionId();

        try {
            const userId = this.extractUserId(request);

            if (!userId) {
                connection.close(1008, 'Authentication required: missing user_id');
                return;
            }

            this.webSocketManager.addConnection(connectionId, userId, connection);

            connection.send(JSON.stringify({
                type: 'success',
                data: {
                    message: 'Connected successfully',
                    payload: {
                        connectionId,
                        userId,
                        timestamp: new Date().toISOString()
                    }
                },
                timestamp: new Date().toISOString()
            }));

            console.log(`WebSocket connected: User ${userId}, Connection ${connectionId}`);

        } catch (error: any) {
            console.error(`WebSocket connection error:`, error);
            connection.close(1011, error.message || 'Internal server error');
        }
    };

    getStats = async (request: FastifyRequest, reply: any) => {
        try {
            const stats = this.webSocketManager.getStats();

            return reply.send({
                success: true,
                data: stats,
                message: 'WebSocket statistics retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    };

    checkUserOnlineStatus = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { userId } = request.params as { userId: number };

            const isOnline = this.webSocketManager.isUserOnline(userId);

            return reply.send({
                success: true,
                data: {
                    userId,
                    isOnline,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    checkMultipleUsersOnlineStatus = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { userIds } = request.body as { userIds: number[] };
            console.log('Checking online status for user IDs:', userIds);
            if (!Array.isArray(userIds) || userIds.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'userIds array is required and must not be empty'
                });
            }

            if (userIds.length > 100) {
                return reply.status(400).send({
                    success: false,
                    error: 'Maximum 100 users can be checked at once'
                });
            }

            const onlineStatus = userIds.map(userId => ({
                userId,
                isOnline: this.webSocketManager.isUserOnline(userId)
            }));

            return reply.send({
                success: true,
                data: {
                    onlineStatus,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    getAllOnlineUsers = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const onlineUsers = this.webSocketManager.getOnlineUsers();

            return reply.send({
                success: true,
                data: {
                    onlineUsers,
                    count: onlineUsers.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message
            });
        }
    };

    private extractUserId(request: FastifyRequest): number | null {
        const query = request.query as any;
        if (query.user_id) {
            const userId = parseInt(query.user_id);
            return isNaN(userId) ? null : userId;
        }

        const userIdHeader = request.headers['x-user-id'];
        if (userIdHeader) {
            const userId = parseInt(userIdHeader as string);
            return isNaN(userId) ? null : userId;
        }

        if (query.token) {
            console.log('Token found but user_id should come from API Gateway headers');
        }

        return null;
    }
}
