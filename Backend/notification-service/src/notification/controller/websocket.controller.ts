import { FastifyRequest, FastifyReply } from 'fastify';
import { WebSocketManager } from '../service/websocket.service.js';

export class WebSocketController {
    private webSocketManager: WebSocketManager;

    constructor(webSocketManager: WebSocketManager) {
        this.webSocketManager = webSocketManager;
    }

    // Generate simple connection ID
    private generateConnectionId(): string {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Handle WebSocket connection
    handleConnection = async (connection: any, request: FastifyRequest) => {
        const connectionId = this.generateConnectionId();

        try {
            // Extract user ID from query parameters or headers
            const userId = this.extractUserId(request);

            if (!userId) {
                connection.close(1008, 'Authentication required: missing user_id');
                return;
            }

            // Add connection to manager
            this.webSocketManager.addConnection(connectionId, userId, connection);

            // Send welcome message
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

    // Get WebSocket statistics
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

    // Get online users
    getOnlineUsers = async (request: FastifyRequest, reply: any) => {
        try {
            const onlineUsers = this.webSocketManager.getOnlineUsers();

            return reply.send({
                success: true,
                data: {
                    online_users: onlineUsers,
                    count: onlineUsers.length
                },
                message: 'Online users retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    };

    // Check if specific user is online
    checkUserOnline = async (request: FastifyRequest, reply: any) => {
        try {
            const { userId } = request.params as { userId: number };
            const isOnline = this.webSocketManager.isUserOnline(userId);

            return reply.send({
                success: true,
                data: {
                    user_id: userId,
                    is_online: isOnline
                },
                message: 'User online status retrieved successfully'
            });
        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    };

    // Helper method to extract user ID from request
    private extractUserId(request: FastifyRequest): number | null {
        // Try to get from query parameters first
        const query = request.query as any;
        if (query.user_id) {
            const userId = parseInt(query.user_id);
            return isNaN(userId) ? null : userId;
        }

        // Try to get from headers (API Gateway should set this)
        const userIdHeader = request.headers['x-user-id'];
        if (userIdHeader) {
            const userId = parseInt(userIdHeader as string);
            return isNaN(userId) ? null : userId;
        }

        // Try to get from token parameter (backup method)
        if (query.token) {
            // For now, we'll expect the user_id to be passed separately
            // since API Gateway should handle JWT and forward user_id
            console.log('Token found but user_id should come from API Gateway headers');
        }

        return null;
    }

    // Get WebSocket manager instance
    getWebSocketManager(): WebSocketManager {
        return this.webSocketManager;
    }

    // Check if specific user is online
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

    // Check multiple users online status (for friends list)
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

    // Get all online users (for friend service integration)
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
}
