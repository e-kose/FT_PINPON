import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import type { RoomManager } from '../engine/room.manager.js';
import {
	WSServerMessageType,
	type WSMessage
} from '../types/game.types.js';

export class MatchmakingHandler extends BaseGameHandler {
	private roomManager: RoomManager;

	constructor(roomManager: RoomManager, socketRegistry: any) {
		super(socketRegistry);
		this.roomManager = roomManager;
	}
	public handleJoinMatchmaking(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) {
			this.sendError(socket, 'User ID required');
			return;
		}

		if (userConnection.currentRoomId) {
			const room = this.roomManager.getRoom(userConnection.currentRoomId);
			if (!room) {
				delete userConnection.currentRoomId;
			} else {
				this.sendError(socket, 'Already in a game');
				return;
			}
		}

		try {
			this.roomManager.addToMatchmakingQueue(userConnection.userId);
			this.sendMessage(socket, {
				type: WSServerMessageType.MATCHMAKING_SEARCHING,
				payload: { timestamp: Date.now() }
			});
		} catch (e: any) {
			this.sendError(socket, e.message);
		}
	}

	public handleLeaveMatchmaking(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection?.userId) return;

		this.roomManager.removeFromMatchmakingQueue(userConnection.userId);
		this.sendMessage(socket, {
			type: WSServerMessageType.ROOM_LEFT,
			payload: { timestamp: Date.now() }
		});
	}
}
