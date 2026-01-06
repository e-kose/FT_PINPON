import { getAccessToken } from "../store/UserStore";
import type { GameMessage } from "../types/GameTypes";

// --- Types ---

export interface GameWebSocketListener {
	onOpen?: () => void;
	onClose?: () => void;
	onError?: (error: Event) => void;
	onMessage?: (message: GameMessage) => void;
}

export type GameWebSocketMessageType =
	| 'SET_USER_ID'
	| 'CREATE_LOCAL_GAME'
	| 'JOIN_MATCHMAKING'
	| 'LEAVE_MATCHMAKING'
	| 'JOIN_TOURNAMENT_QUEUE'
	| 'LEAVE_TOURNAMENT_QUEUE'
	| 'LEAVE_TOURNAMENT'
	| 'PLAYER_INPUT'
	| 'LEAVE_ROOM';

export interface PlayerInputPayload {
	action: 'move_up' | 'move_down' | 'stop';
	playerPosition?: 'left' | 'right';
}

export interface SetUserIdPayload {
	userId: string;
}

export interface TournamentQueuePayload {
	size: 4 | 8;
}

// --- Service ---

class GameWebSocketService {
	private ws: WebSocket | null = null;
	private listeners: GameWebSocketListener[] = [];
	private readonly WS_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/^http/, 'ws') + "/game/ws";

	public connect(): void {
		const token = getAccessToken();
		if (!token) {
			console.error("Cannot connect to Game WS: No access token");
			return;
		}

		if (this.ws) {
			this.ws.close();
		}

		this.ws = new WebSocket(`${this.WS_URL}?token=${token}`);

		this.ws.onopen = () => {
			this.listeners.forEach(l => l.onOpen?.());
		};

		this.ws.onclose = () => {
			this.listeners.forEach(l => l.onClose?.());
		};

		this.ws.onerror = (error) => {
			console.error("Game WS Error", error);
			this.listeners.forEach(l => l.onError?.(error));
		};

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.listeners.forEach(l => l.onMessage?.(data));
			} catch (e) {
				console.error("Error parsing Game WS message", e);
			}
		};
	}

	public disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	public sendMessage(type: GameWebSocketMessageType, payload?: any): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type, payload }));
		} else {
			console.warn("Game WS not connected, cannot send message:", type);
		}
	}

	public addListener(listener: GameWebSocketListener): void {
		this.listeners.push(listener);
	}

	public removeListener(listener: GameWebSocketListener): void {
		this.listeners = this.listeners.filter(l => l !== listener);
	}

	public isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}
}

export const gameWebSocketService = new GameWebSocketService();
