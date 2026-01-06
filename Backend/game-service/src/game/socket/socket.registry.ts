import type { WebSocket } from '@fastify/websocket';
import type { UserConnection } from './socket.types.js';

export class SocketRegistry {
	private userSockets: Map<string, UserConnection> = new Map();
	private userIdToSocketId: Map<string, string> = new Map();
	private roomSockets: Map<string, Set<string>> = new Map();
	private tournamentSockets: Map<string, Set<string>> = new Map();
	private socketIdCounter = 0;

	public addConnection(socket: WebSocket, socketId: string, userId: string | undefined, username: string): UserConnection {
		const connection: UserConnection = {
			socket,
			socketId,
			username,
			connectedAt: Date.now(),
		};
		if (userId) {
			connection.userId = userId;
		}
		console.log("username:", username);
		console.log('Setting username for socket:', socketId, 'to', username);
		this.userSockets.set(socketId, connection);
		if (userId) {
			this.userIdToSocketId.set(userId, socketId);
		}
		return connection;
	}

	public getConnection(socketId: string): UserConnection | undefined {
		return this.userSockets.get(socketId);
	}

	public getConnectionByUserId(userId: string): UserConnection | undefined {
		const socketId = this.userIdToSocketId.get(userId);
		if (!socketId) return undefined;
		return this.userSockets.get(socketId);
	}

	public removeConnection(socketId: string): void {
		const connection = this.userSockets.get(socketId);
		if (connection) {
		if (connection.userId) {
			if (this.userIdToSocketId.get(connection.userId) === socketId) {
					this.userIdToSocketId.delete(connection.userId);
				}
			}
			this.userSockets.delete(socketId);

			if (connection.currentRoomId) {
				this.removeSocketFromRoom(socketId, connection.currentRoomId);
			}
			if (connection.currentTournamentId) {
				this.removeSocketFromTournament(socketId, connection.currentTournamentId);
			}
		}
	}

	public updateUserId(socketId: string, newUserId: string): void {
		const connection = this.userSockets.get(socketId);
		if (!connection) return;

		if (connection.userId) {
			this.userIdToSocketId.delete(connection.userId);
		}

		connection.userId = newUserId;
		this.userIdToSocketId.set(newUserId, socketId);
	}

	public generateSocketId(): string {
		return `socket_${++this.socketIdCounter}_${Date.now()}`;
	}

	public addToRoom(socketId: string, roomId: string): void {
		const connection = this.userSockets.get(socketId);
		if (connection) {
			connection.currentRoomId = roomId;
		}

		if (!this.roomSockets.has(roomId)) {
			this.roomSockets.set(roomId, new Set());
		}
		this.roomSockets.get(roomId)!.add(socketId);
	}

	public removeSocketFromRoom(socketId: string, roomId: string): void {
		const connection = this.userSockets.get(socketId);
		if (connection && connection.currentRoomId === roomId) {
			delete connection.currentRoomId;
		}

		const set = this.roomSockets.get(roomId);
		if (set) {
			set.delete(socketId);
			if (set.size === 0) {
				this.roomSockets.delete(roomId);
			}
		}
	}

	public getRoomSockets(roomId: string): string[] {
		const set = this.roomSockets.get(roomId);
		return set ? Array.from(set) : [];
	}

	public addToTournament(socketId: string, tournamentId: string): void {
		const connection = this.userSockets.get(socketId);
		if (connection) {
			connection.currentTournamentId = tournamentId;
		}

		if (!this.tournamentSockets.has(tournamentId)) {
			this.tournamentSockets.set(tournamentId, new Set());
		}
		this.tournamentSockets.get(tournamentId)!.add(socketId);
	}

	public removeSocketFromTournament(socketId: string, tournamentId: string): void {
		const connection = this.userSockets.get(socketId);
		if (connection && connection.currentTournamentId === tournamentId) {
			delete connection.currentTournamentId;
		}

		const set = this.tournamentSockets.get(tournamentId);
		if (set) {
			set.delete(socketId);
			if (set.size === 0) {
				this.tournamentSockets.delete(tournamentId);
			}
		}
	}

	public getTournamentSockets(tournamentId: string): string[] {
		const set = this.tournamentSockets.get(tournamentId);
		return set ? Array.from(set) : [];
	}
}
