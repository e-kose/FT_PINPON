import { EventEmitter } from 'events';
import {
    WebSocketConnection,
    WebSocketMessage,
    NotificationWebSocketMessage,
    ErrorWebSocketMessage,
    SuccessWebSocketMessage,
    WebSocketStats
} from '../types/websocket.types.js';
import { Notification } from '../types/notification.types.js';

export class WebSocketManager extends EventEmitter {
    private connections: Map<string, WebSocketConnection> = new Map();
    private userConnections: Map<number, Set<string>> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startHeartbeat();
    }

    // Add a new WebSocket connection
    addConnection(connectionId: string, userId: number, socket: any): void {
        // Validate socket object
        if (!socket || typeof socket.on !== 'function') {
            console.error(`Invalid socket provided for connection ${connectionId}:`, socket);
            return;
        }

        const connection: WebSocketConnection = {
            id: connectionId,
            userId,
            socket,
            isAlive: true,
            lastPong: new Date()
        };

        this.connections.set(connectionId, connection);

        // Track user connections
        const wasOffline = !this.userConnections.has(userId);
        if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId)!.add(connectionId);

        // Setup socket event handlers
        this.setupSocketHandlers(connection);

        // Emit user came online event if this is their first connection
        if (wasOffline) {
            this.emit('user_online', { userId, timestamp: new Date().toISOString() });
            console.log(`User ${userId} came online`);
        }

        console.log(`WebSocket connection added: ${connectionId} for user ${userId}`);
    }

    // Remove a WebSocket connection
    removeConnection(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { userId } = connection;

        // Remove from connections
        this.connections.delete(connectionId);

        // Remove from user connections
        const userConnections = this.userConnections.get(userId);
        if (userConnections) {
            userConnections.delete(connectionId);
            // If this was the user's last connection, they are now offline
            if (userConnections.size === 0) {
                this.userConnections.delete(userId);
                // Emit user went offline event
                this.emit('user_offline', { userId, timestamp: new Date().toISOString() });
                console.log(`User ${userId} went offline`);
            }
        }

        console.log(`WebSocket connection removed: ${connectionId} for user ${userId}`);
    }

    // Send notification to specific user
    sendNotificationToUser(userId: number, notification: Notification, action: 'created' | 'updated' | 'deleted' | 'marked_read' | 'marked_unread'): void {
        const message: NotificationWebSocketMessage = {
            type: 'notification',
            data: {
                notification,
                action
            },
            timestamp: new Date().toISOString()
        };

        this.sendToUser(userId, message);
    }

    // Send message to a specific user (all their connections)
    sendToUser(userId: number, message: WebSocketMessage): void {
        const connectionIds = this.userConnections.get(userId);
        if (!connectionIds) return;

        connectionIds.forEach(connectionId => {
            const connection = this.connections.get(connectionId);
            if (connection) {
                this.sendMessage(connection, message);
            }
        });

        if (connectionIds.size > 0) {
            console.log(`Message sent to user ${userId} (${connectionIds.size} connections)`);
        }
    }

    // Get WebSocket statistics
    getStats(): WebSocketStats {
        const connectionsPerUser: Record<number, number> = {};

        this.userConnections.forEach((connections, userId) => {
            connectionsPerUser[userId] = connections.size;
        });

        return {
            totalConnections: this.connections.size,
            activeUsers: this.userConnections.size,
            connectionsPerUser
        };
    }

    // Check if user is online
    isUserOnline(userId: number): boolean {
        return this.userConnections.has(userId);
    }

    // Get all online users
    getOnlineUsers(): number[] {
        return Array.from(this.userConnections.keys());
    }

    // Private method to send message to a connection
    private sendMessage(connection: WebSocketConnection, message: WebSocketMessage): void {
        try {
            if (!connection.socket || typeof connection.socket.send !== 'function') {
                console.error(`Invalid socket for connection ${connection.id}, removing connection`);
                this.removeConnection(connection.id);
                return;
            }

            if (connection.socket.readyState === 1) { // WebSocket.OPEN
                connection.socket.send(JSON.stringify(message));
            } else {
                this.removeConnection(connection.id);
            }
        } catch (error) {
            console.error(`Error sending message to connection ${connection.id}:`, error);
            this.removeConnection(connection.id);
        }
    }

    // Setup socket event handlers
    private setupSocketHandlers(connection: WebSocketConnection): void {
        const { socket } = connection;

        // Check if socket is valid
        if (!socket || typeof socket.on !== 'function') {
            console.error(`Invalid socket object for connection ${connection.id}:`, socket);
            this.removeConnection(connection.id);
            return;
        }

        socket.on('close', () => {
            this.removeConnection(connection.id);
        });

        socket.on('error', (error: Error) => {
            console.error(`WebSocket error for connection ${connection.id}:`, error);
            this.removeConnection(connection.id);
        });

        socket.on('pong', () => {
            connection.isAlive = true;
            connection.lastPong = new Date();
        });

        // Handle incoming messages
        socket.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString()) as WebSocketMessage;
                this.handleIncomingMessage(connection, message);
            } catch (error) {
                console.error(`Error parsing message from connection ${connection.id}:`, error);
            }
        });
    }

    // Handle incoming messages from clients
    private handleIncomingMessage(connection: WebSocketConnection, message: WebSocketMessage): void {
        switch (message.type) {
            case 'ping':
                this.sendMessage(connection, { type: 'pong', timestamp: new Date().toISOString() });
                break;

            case 'pong':
                connection.isAlive = true;
                connection.lastPong = new Date();
                break;

            default:
                console.log(`Received message type ${message.type} from connection ${connection.id}`);
                break;
        }
    }

    // Start heartbeat to check connection health
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.connections.forEach(connection => {
                if (!connection.isAlive) {
                    this.removeConnection(connection.id);
                    return;
                }

                connection.isAlive = false;
                try {
                    connection.socket.ping();
                } catch (error) {
                    this.removeConnection(connection.id);
                }
            });
        }, 30000);
    }

    // Cleanup method
    destroy(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        this.connections.forEach(connection => {
            try {
                connection.socket.close();
            } catch (error) {
                console.error(`Error closing connection ${connection.id}:`, error);
            }
        });

        this.connections.clear();
        this.userConnections.clear();
        this.removeAllListeners();
    }
}
