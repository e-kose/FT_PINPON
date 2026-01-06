import type { SocketRegistry } from '../socket/socket.registry.js';
import type { WebSocket } from '@fastify/websocket';
import { WSServerMessageType, type WSMessage } from '../types/game.types.js';

export abstract class BaseGameHandler {
	protected socketRegistry: SocketRegistry;

	constructor(socketRegistry: SocketRegistry) {
		this.socketRegistry = socketRegistry;
	}

	protected sendMessage(socket: WebSocket, message: WSMessage): void {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}

	protected sendError(socket: WebSocket, message: string): void {
		this.sendMessage(socket, {
			type: WSServerMessageType.ERROR,
			payload: { message }
		});
	}
}
