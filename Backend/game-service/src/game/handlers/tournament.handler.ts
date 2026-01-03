import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import {
	WSServerMessageType,
	type WSMessage
} from '../types/game.types.js';

export class TournamentHandler extends BaseGameHandler {

	public handleJoinQueue(socketId: string, socket: WebSocket, payload: any): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) {
			this.sendError(socket, 'User ID required');
			return;
		}

		const { size } = payload;
		if (size !== 4 && size !== 8) {
			this.sendError(socket, 'Invalid tournament size');
			return;
		}

		const { success, waiting } = this.gameService.joinTournamentQueue(userConnection.userId, size);

		if (success) {
			this.sendMessage(socket, {
				type: WSServerMessageType.TOURNAMENT_QUEUE_JOINED,
				payload: {
					size
				}
			});
		}
	}

	public handleLeaveQueue(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) return;

		this.gameService.leaveTournamentQueue(userConnection.userId);
		this.sendMessage(socket, {
			type: WSServerMessageType.TOURNAMENT_QUEUE_LEFT,
			payload: { message: 'Left tournament queue', timestamp: Date.now() }
		});
	}

	public handleLeaveTournament(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection || !userConnection.userId || !userConnection.currentTournamentId) return;

		try {
			this.gameService.leaveTournament(userConnection.currentTournamentId, userConnection.userId);
			// Socket Registry update
			this.socketRegistry.removeSocketFromTournament(socketId, userConnection.currentTournamentId);

			this.sendMessage(socket, {
				type: WSServerMessageType.LEAVE_TOURNAMENT,
				payload: { message: 'Left tournament', timestamp: Date.now() }
			});
		} catch (error: any) {
			console.error('[LEAVE_TOURNAMENT] Error:', error);
		}
	}

	protected sendMessage(socket: WebSocket, message: WSMessage) {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}

	protected sendError(socket: WebSocket, message: string) {
		this.sendMessage(socket, { type: WSServerMessageType.ERROR, payload: { message } });
	}
}
