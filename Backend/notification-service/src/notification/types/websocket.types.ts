import { Notification } from './notification.types.js';

export interface WebSocketConnection {
    id: string;
    userId: number;
    socket: any; // WebSocket socket from fastify-websocket
    isAlive: boolean;
    lastPong: Date;
}

export interface WebSocketMessage {
    type: 'notification' | 'ping' | 'pong' | 'auth' | 'error' | 'success';
    data?: any;
    timestamp?: string;
}

export interface NotificationWebSocketMessage extends WebSocketMessage {
    type: 'notification';
    data: {
        notification: Notification;
        action: 'created' | 'updated' | 'deleted' | 'marked_read' | 'marked_unread';
    };
}

export interface WebSocketStats {
    totalConnections: number;
    activeUsers: number;
    connectionsPerUser: Record<number, number>;
}
