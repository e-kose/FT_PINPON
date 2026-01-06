import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import type { TournamentManager } from '../engine/tournament.manager.js';
import {
	WSServerMessageType,
	type WSMessage
} from '../types/game.types.js';

export class TournamentHandler extends BaseGameHandler {
	private tournamentManager: TournamentManager;

	constructor(tournamentManager: TournamentManager, socketRegistry: any) {
		super(socketRegistry);
		this.tournamentManager = tournamentManager;
	}

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

		this.tournamentManager.joinQueue(userConnection.userId, userConnection.username, size);
		this.sendMessage(socket, {
			type: WSServerMessageType.TOURNAMENT_QUEUE_JOINED,
			payload: { size }
		});
	}

	public handleLeaveQueue(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) return;

		this.tournamentManager.leaveQueue(userConnection.userId);
		this.sendMessage(socket, {
			type: WSServerMessageType.TOURNAMENT_QUEUE_LEFT,
			payload: { timestamp: Date.now() }
		});
	}

	public handleLeaveTournament(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection || !userConnection.userId || !userConnection.currentTournamentId) return;

		try {
			this.tournamentManager.leaveTournament(userConnection.currentTournamentId, userConnection.userId);
			this.socketRegistry.removeSocketFromTournament(socketId, userConnection.currentTournamentId);

			this.sendMessage(socket, {
				type: WSServerMessageType.LEAVE_TOURNAMENT,
				payload: { timestamp: Date.now() }
			});
		} catch (error: any) {
			console.error('[LEAVE_TOURNAMENT] Error:', error);
		}
	}
}
