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
	username: string;
	connected: boolean;
	exited?: boolean;
}

export interface TournamentMatch {
	id: string;
	round: number;
	matchIndex: number;
	player1Id: string | null;
	player1Username: string | null;
	player2Id: string | null;
	player2Username: string | null;
	winnerId: string | null;
	winnerUsername: string | null;
	nextMatchId: string | null;
	status: 'pending' | 'scheduled' | 'in_progress' | 'finished';
	roomId: string | null;
}

export interface TournamentRound {
	roundNumber: number;
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
