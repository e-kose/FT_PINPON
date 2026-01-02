import type { WebSocket } from '@fastify/websocket';

export interface UserConnection {
	socket: WebSocket;
	socketId: string;
	userId?: string;
	currentRoomId?: string;
	currentTournamentId?: string;
	connectedAt: number;
}
