import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import type { RoomManager } from '../engine/room.manager.js';
import {
	WSServerMessageType,
	PlayerPosition,
	GameMode,
	type PlayerInputPayload,
	type CreateLocalGamePayload
} from '../types/game.types.js';
import { GameRoom } from '../engine/game.room.js';

export class RoomHandler extends BaseGameHandler {
	private roomManager: RoomManager;

	constructor(roomManager: RoomManager, socketRegistry: any) {
		super(socketRegistry);
		this.roomManager = roomManager;
	}

	public handleCreateLocalGame(socketId: string, socket: WebSocket, payload?: CreateLocalGamePayload): GameRoom | null {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection) return null;

		const userId = userConnection.userId || `guest-${socketId}`;

		try {
			const { roomId, room } = this.roomManager.createLocalGame(userId, payload?.config);
			this.socketRegistry.addToRoom(socketId, roomId);

			this.sendMessage(socket, {
				type: WSServerMessageType.ROOM_CREATED,
				payload: { roomId, mode: room.mode, timestamp: Date.now() }
			});
			this.sendMessage(socket, {
				type: WSServerMessageType.PLAYER_ASSIGNED,
				payload: { playerPosition: PlayerPosition.LEFT, userId: `${userId}-p1` }
			});
			this.sendMessage(socket, {
				type: WSServerMessageType.PLAYER_ASSIGNED,
				payload: { playerPosition: PlayerPosition.RIGHT, userId: `${userId}-p2` }
			});

			room.start();
			return room;
		} catch (e: any) {
			this.sendError(socket, e.message);
			return null;
		}
	}

	public handlePlayerInput(socketId: string, socket: WebSocket, payload: PlayerInputPayload): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection) return;


	const { currentRoomId, userId } = userConnection;
	if (!currentRoomId) {
		this.sendError(socket, 'Not in any game room');
		return;
	}

	const room = this.roomManager.getRoom(currentRoomId);
	if (!room) {
		this.sendError(socket, 'Room not found');
		return;
	}		try {
			let playerPosition: PlayerPosition | null = null;
			if (room.mode === 'local') {
				if (!payload.playerPosition) {
					this.sendError(socket, 'Player position required for local mode');
					return;
				}
				playerPosition = payload.playerPosition;
			} else {
				if (!userId) {
					this.sendError(socket, 'User ID required for online mode');
					return;
				}
				playerPosition = this.roomManager.getUserPosition(currentRoomId, userId);
				if (!playerPosition) {
					this.sendError(socket, 'You are not a player in this game');
					return;
				}
			}

			room.handleInput(playerPosition, payload.action);
		} catch (error: any) {
			this.sendError(socket, error.message || 'Failed to process input');
		}
	}

	public handleLeaveRoom(socketId: string, socket: WebSocket): void {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection) return;

		const { currentRoomId, userId } = userConnection;
		if (!currentRoomId) {
			this.sendError(socket, 'Not in any game room');
			return;
		}

		const room = this.roomManager.getRoom(currentRoomId);

		if (room && (room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT) && userId) {
			room.handlePlayerDisconnect(userId);
		} else if (room) {
			room.stop();
			this.roomManager.deleteRoom(currentRoomId);
		}

		this.socketRegistry.removeSocketFromRoom(socketId, currentRoomId);

		this.sendMessage(socket, {
			type: WSServerMessageType.ROOM_LEFT,
			payload: { roomId: currentRoomId, timestamp: Date.now() }
		});
	}
}
