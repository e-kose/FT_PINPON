/**
 * Tournament Types
 * Type definitions for tournament mode
 */

import type { Player } from './game.types.js';

export type TournamentSize = 4 | 8;

export enum TournamentState {
	WAITING = 'waiting',
	IN_PROGRESS = 'in_progress',
	FINISHED = 'finished',
}

export interface TournamentPlayer extends Omit<Player, 'position' | 'paddle' | 'score'> {
	// Add any tournament specific player info here if needed
	// For now we just reuse the basic player info (id)
	displayName?: string;
	connected: boolean;
	exited?: boolean;
}

export interface TournamentMatch {
	id: string;
	round: number;
	matchIndex: number; // Index within the round (0, 1, 2...)
	player1Id: string | null; // null if waiting for winner of previous round
	player2Id: string | null;
	winnerId: string | null;
	nextMatchId: string | null; // ID of the match the winner advances to
	status: 'pending' | 'scheduled' | 'in_progress' | 'finished';
	roomId: string | null; // GameRoom ID if match is in progress
}

export interface TournamentRound {
	roundNumber: number; // 0 = First Round, 1 = Semis, etc.
	matches: TournamentMatch[];
}

export interface TournamentBracket {
	rounds: TournamentRound[];
	winnerId: string | null;
}

export interface TournamentData {
	id: string;
	size: TournamentSize;
	state: TournamentState;
	players: TournamentPlayer[];
	bracket: TournamentBracket;
	currentRound: number;
}

// ============================================================================
// WebSocket Payloads
// ============================================================================

export interface CreateTournamentPayload {
	size: TournamentSize;
}

export interface JoinTournamentPayload {
	tournamentId: string;
}

export interface TournamentStateUpdatePayload {
	tournament: TournamentData;
}

export interface TournamentMatchUpdatePayload {
	matchId: string;
	status: string;
	winnerId?: string;
}
