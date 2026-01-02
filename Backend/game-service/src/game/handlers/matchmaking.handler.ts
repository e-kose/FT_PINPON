import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import {
	WSServerMessageType,
	type WSMessage
} from '../types/game.types.js';

export class MatchmakingHandler extends BaseGameHandler {
	public handleJoinMatchmaking(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) {
			this.sendMessage(socket, { type: WSServerMessageType.ERROR, payload: { message: 'User ID required' } });
			return;
		}

		if (userConnection.currentRoomId) {
			// Check if room exists
			const room = this.gameService.getRoom(userConnection.currentRoomId);
			if (!room) {
				// Auto-fix
				delete userConnection.currentRoomId; // Need to fix this in Registry if possible?
				// Technically I can modify the object directly as it is a reference.
				// Ideally use registry method if we want to be clean, but direct modification is fine here
				// since we are the application Logic accessing the Registry state.
				// Actually, let's use the registry method 'removeSocketFromRoom' but that clears it from map too.
				// But 'userConnection.currentRoomId' is a property.
				// Since 'getConnection' returns a reference, we can modify it.
			} else {
				this.sendMessage(socket, { type: WSServerMessageType.ERROR, payload: { message: 'Already in a game' } });
				return;
			}
		}

		try {
			this.gameService.joinMatchmaking(userConnection.userId);
			this.sendMessage(socket, { type: WSServerMessageType.MATCHMAKING_SEARCHING, payload: { message: 'Searching...', timestamp: Date.now() } });
		} catch (e: any) {
			this.sendMessage(socket, { type: WSServerMessageType.ERROR, payload: { message: e.message } });
		}
	}

	public handleLeaveMatchmaking(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) return;

		this.gameService.leaveMatchmaking(userConnection.userId);
		this.sendMessage(socket, { type: WSServerMessageType.ROOM_LEFT, payload: { message: 'Left queue', timestamp: Date.now() } });
	}

	protected sendMessage(socket: WebSocket, message: WSMessage) {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}
}
