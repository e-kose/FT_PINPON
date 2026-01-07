
export interface GameMatch {
	id?: string | number; // ID might not be present in all contexts or might be number
	status: 'scheduled' | 'in_progress' | 'finished';
	player1Id: string | null;
	player2Id: string | null;
	player1Username: string | null;
	player2Username: string | null;
	winnerId: string | null;
}

export interface TournamentRound {
	matches: GameMatch[];
}

export interface TournamentBracket {
	rounds: TournamentRound[];
	winnerId?: string | null;
}

export interface TournamentData {
	id: string;
	status: 'waiting' | 'started' | 'finished';
	state?: 'waiting' | 'started' | 'finished'; // Sometimes state is used instead of status
	players: Array<{ id: string; username: string }>;
	bracket: TournamentBracket;
}

export interface PaddleState {
	y: number;
}

export interface PlayerState {
	id: string; // User ID or socket ID
	username: string;
	score: number;
	paddle: PaddleState;
}

export interface BallState {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface GameState {
	players: {
		left: PlayerState;
		right: PlayerState;
	};
	ball: BallState;
	status: 'playing' | 'finished' | 'paused';
}

export interface GameOverPayload {
	roomId: string;
	winner: 'left' | 'right';
	winnerId: string;
	loserId: string;
	finalScore: {
		left: number;
		right: number;
	};
	timestamp: number;
	winnerUsername: string;
	loserUsername: string;
}

// WebSocket Messages

export interface MatchmakingSearchingMessage {
	type: 'MATCHMAKING_SEARCHING';
	payload: any; // Payload structure not strictly defined yet, can be improved later
}

export interface TournamentQueueJoinedMessage {
	type: 'TOURNAMENT_QUEUE_JOINED';
	payload: null;
}

export interface TournamentQueueLeftMessage {
	type: 'TOURNAMENT_QUEUE_LEFT';
	payload: null;
}

export interface LeaveTournamentMessage {
	type: 'LEAVE_TOURNAMENT';
	payload: null;
}

export interface TournamentCreatedMessage {
	type: 'TOURNAMENT_CREATED';
	payload: null;
}

export interface TournamentStateMessage {
	type: 'TOURNAMENT_STATE';
	payload: {
		tournament: TournamentData;
	};
}

export interface MatchFoundMessage {
	type: 'MATCH_FOUND';
	payload: any;
}

export interface RoomCreatedMessage {
	type: 'ROOM_CREATED';
	payload: any;
}

export interface GameStateMessage {
	type: 'GAME_STATE' | 'STATE_UPDATE';
	payload: GameState;
}

export interface GameOverMessage {
	type: 'GAME_OVER';
	payload: GameOverPayload;
}

export interface ErrorMessage {
	type: 'ERROR';
	payload: string;
}

export type GameMessage =
	| MatchmakingSearchingMessage
	| TournamentQueueJoinedMessage
	| TournamentQueueLeftMessage
	| LeaveTournamentMessage
	| TournamentCreatedMessage
	| TournamentStateMessage
	| MatchFoundMessage
	| RoomCreatedMessage
	| GameStateMessage
	| GameOverMessage
	| ErrorMessage;
