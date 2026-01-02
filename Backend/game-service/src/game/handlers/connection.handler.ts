import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import {
	WSServerMessageType,
} from '../types/game.types.js';

export class ConnectionHandler extends BaseGameHandler {
	public handleSetUserId(socketId: string, socket: WebSocket, payload: any): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection) return;

		const { userId } = payload;

		if (!userId || typeof userId !== 'string') {
			this.sendError(socket, 'Invalid user ID');
			return;
		}

		// Check for existing connection
		const existingConnection = this.socketRegistry.getConnectionByUserId(userId);
		if (existingConnection && existingConnection.socketId !== socketId) {
			this.sendError(existingConnection.socket, 'New connection established with your user ID');
			existingConnection.socket.close();
			this.socketRegistry.removeConnection(existingConnection.socketId);
		}

		this.socketRegistry.updateUserId(socketId, userId);
	}

	protected sendError(socket: WebSocket, message: string) {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify({ type: WSServerMessageType.ERROR, payload: { message } }));
		}
	}
}
