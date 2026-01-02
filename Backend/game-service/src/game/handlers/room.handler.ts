import { BaseGameHandler } from './base.handler.js';
import type { WebSocket } from '@fastify/websocket';
import {
	WSServerMessageType,
	PlayerPosition,
	GameMode,
	type PlayerInputPayload,
	type CreateLocalGamePayload,
	type PlayerDisconnectedPayload,
	type GameOverData
} from '../types/game.types.js';
import { GameRoom } from '../engine/game.room.js';

export class RoomHandler extends BaseGameHandler {

	public handleCreateLocalGame(socketId: string, socket: WebSocket, payload?: CreateLocalGamePayload): GameRoom | null {
		const userConnection = this.socketRegistry.getConnection(socketId);
		if (!userConnection) return null;

		// In local game, if no userId is set, use a temporary one
		const userId = userConnection.userId || `guest-${socketId}`;

		try {
			const { roomId, room } = this.gameService.createLocalGame(userId, payload?.config);
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

		const room = this.gameService.getRoom(currentRoomId);
		if (!room) {
			this.sendError(socket, 'Room not found');
			return;
		}

		try {
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
				playerPosition = this.gameService.getUserPosition(currentRoomId, userId);
				if (!playerPosition) {
					this.sendError(socket, 'You are not a player in this game');
					return;
				}
			}

			this.gameService.handlePlayerInput(currentRoomId, playerPosition, payload.action);
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

		const room = this.gameService.getRoom(currentRoomId);

		// If room exists and it's a tracked game (Matchmaking/Tournament), handle forfeit
		if (room && (room.mode === GameMode.MATCHMAKING || room.mode === GameMode.TOURNAMENT) && userId) {
			room.handlePlayerDisconnect(userId);
			// Room will emit 'gameOver', which the Controller listens to.
		} else if (room) {
			// Local room or other
			room.stop();
			this.gameService.deleteRoom(currentRoomId);
			// We need to clean up socket registry for this room?
			// The 'deleteRoom' in service just removes it from memory.
			// Registry clean up happens below.
		}

		this.socketRegistry.removeSocketFromRoom(socketId, currentRoomId);

		this.sendMessage(socket, {
			type: WSServerMessageType.ROOM_LEFT,
			payload: { roomId: currentRoomId, timestamp: Date.now() }
		});
	}

	protected sendMessage(socket: WebSocket, message: any) {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}

	protected sendError(socket: WebSocket, message: string) {
		this.sendMessage(socket, {
			type: WSServerMessageType.ERROR,
			payload: { message }
		});
	}
}
