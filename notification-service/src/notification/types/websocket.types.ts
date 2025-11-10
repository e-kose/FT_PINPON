import { FastifyRequest } from 'fastify';
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

export interface AuthWebSocketMessage extends WebSocketMessage {
    type: 'auth';
    data: {
        user_id: number;
        token?: string;
    };
}

export interface PingWebSocketMessage extends WebSocketMessage {
    type: 'ping';
    data?: never;
}

export interface PongWebSocketMessage extends WebSocketMessage {
    type: 'pong';
    data?: never;
}

export interface ErrorWebSocketMessage extends WebSocketMessage {
    type: 'error';
    data: {
        message: string;
        code?: string;
    };
}

export interface SuccessWebSocketMessage extends WebSocketMessage {
    type: 'success';
    data: {
        message: string;
        payload?: any;
    };
}

export type AllWebSocketMessages =
    | NotificationWebSocketMessage
    | AuthWebSocketMessage
    | PingWebSocketMessage
    | PongWebSocketMessage
    | ErrorWebSocketMessage
    | SuccessWebSocketMessage;

export interface WebSocketStats {
    totalConnections: number;
    activeUsers: number;
    connectionsPerUser: Record<number, number>;
}
