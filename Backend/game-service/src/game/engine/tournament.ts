/**
 * Tournament
 * Represents a single tournament instance
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
	TournamentState,
	type TournamentSize,
	type TournamentPlayer,
	type TournamentBracket,
	type TournamentMatch,
	type TournamentRound,
	type TournamentData,
} from '../types/tournament.types.js';
import { RoomManager } from './room.manager.js';
import { type GameConfig, GameMode } from '../types/game.types.js';

export class Tournament extends EventEmitter {
	public readonly id: string;
	public readonly size: TournamentSize;
	private state: TournamentState = TournamentState.WAITING;
	private players: Map<string, TournamentPlayer> = new Map();
	private bracket: TournamentBracket;
	private roomManager: RoomManager;
	private currentRoundIndex: number = 0;

	constructor(id: string, size: TournamentSize, roomManager: RoomManager) {
		super();
		this.id = id;
		this.size = size;
		this.roomManager = roomManager;
		this.bracket = {
			rounds: [],
			winnerId: null,
		};
	}

	public addPlayer(userId: string): boolean {
		if (this.state !== TournamentState.WAITING) return false;
		if (this.players.size >= this.size) return false;
		if (this.players.has(userId)) return true; // Already joined

		this.players.set(userId, {
			id: userId,
			connected: true,
		});

		this.emitStateUpdate();

		if (this.players.size === this.size) {
			this.startTournament();
		}

		return true;
	}

	public removePlayer(userId: string, isExplicitLeave: boolean = false): void {
		if (this.state === TournamentState.WAITING) {
			this.players.delete(userId);
			this.emitStateUpdate();
		} else {
			// Tournament in progress
			const player = this.players.get(userId);
			if (player) {
				console.log(`[TOURNAMENT] Player ${userId} disconnected. Marking as exited/disqualified.`);
				player.connected = false;
				player.exited = true; // Strict rule: Any disconnect = disqualification/exit

				// Check if player is in an active match and forfeit it
				this.checkAndForfeitActiveMatch(userId);

				this.emitStateUpdate();
			}
		}
	}

	private checkAndForfeitActiveMatch(userId: string): void {
		// Find active match this player is involved in
		for (const round of this.bracket.rounds) {
			for (const match of round.matches) {
				if (match.status === 'in_progress' && (match.player1Id === userId || match.player2Id === userId)) {
					console.log(`[TOURNAMENT] Forfeiting active match ${match.id} for disconnected player ${userId}`);

					// If we have a roomId, let the GameRoom handle it (it emits gameOver)
					if (match.roomId) {
						const room = this.roomManager.getRoom(match.roomId);
						if (room) {
							// This triggers gameOver event which we listen to in startMatch
							room.handlePlayerDisconnect(userId);
							return;
						}
					}

					// If no room found (edge case) or room already gone, handle forfeit manually
					const winnerId = match.player1Id === userId ? match.player2Id : match.player1Id;
					if (winnerId) {
						this.handleMatchResult(match, winnerId);
					}
				}
			}
		}
	}

	public getPlayer(userId: string): TournamentPlayer | undefined {
		return this.players.get(userId);
	}

	public getPlayers(): TournamentPlayer[] {
		return Array.from(this.players.values());
	}

	public getData(): TournamentData {
		// Convert Map to Array for JSON
		const playersArray = Array.from(this.players.values());

		return {
			id: this.id,
			size: this.size,
			state: this.state,
			players: playersArray,
			bracket: this.bracket,
			currentRound: this.currentRoundIndex,
		};
	}

	private startTournament(): void {
		this.state = TournamentState.IN_PROGRESS;
		this.generateBracket();
		this.scheduleMatchesForRound(0);
		this.emitStateUpdate();
	}

	private generateBracket(): void {
		// Generate bracket structure based on size
		// 4 players: 2 rounds (Semis -> Final)
		// 8 players: 3 rounds (Quarters -> Semis -> Final)

		const playerIds = Array.from(this.players.keys());
		// Shuffle players
		for (let i = playerIds.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = playerIds[i]!;
			playerIds[i] = playerIds[j]!;
			playerIds[j] = temp;
		}

		const roundsCount = Math.log2(this.size); // 4->2, 8->3

		for (let i = 0; i < roundsCount; i++) {
			const matchesInRound = this.size / Math.pow(2, i + 1);
			const round: TournamentRound = {
				roundNumber: i,
				matches: [],
			};

			for (let j = 0; j < matchesInRound; j++) {
				const matchId = `${this.id}-r${i}-m${j}`;
				let nextMatchId: string | null = null;

				// Calculate next match ID (except for final round)
				if (i < roundsCount - 1) {
					const nextMatchIndex = Math.floor(j / 2);
					nextMatchId = `${this.id}-r${i + 1}-m${nextMatchIndex}`;
				}

				const p1 = i === 0 ? playerIds[j * 2] : null;
				const p2 = i === 0 ? playerIds[j * 2 + 1] : null;

				const match: TournamentMatch = {
					id: matchId,
					round: i,
					matchIndex: j,
					player1Id: p1 || null,
					player2Id: p2 || null,
					winnerId: null,
					nextMatchId: nextMatchId,
					status: i === 0 ? 'scheduled' : 'pending',
					roomId: null,
				};
				round.matches.push(match);
			}
			this.bracket.rounds.push(round);
		}
	}

	private scheduleMatchesForRound(roundIndex: number): void {
		const round = this.bracket.rounds[roundIndex];
		if (!round) return;

		for (const match of round.matches) {
			if (match.player1Id && match.player2Id && !match.winnerId) {
				this.startMatch(match);
			}
		}
	}

	private startMatch(match: TournamentMatch): void {
		if (!match.player1Id || !match.player2Id) return;

		const p1 = this.players.get(match.player1Id);
		const p2 = this.players.get(match.player2Id);

		// Check for offline players
		const p1Offline = !p1 || !p1.connected;
		const p2Offline = !p2 || !p2.connected;

		if (p1Offline && p2Offline) {
			console.log(`[TOURNAMENT] Both players offline for match ${match.id}. Randomly advancing ${match.player1Id}`);
			// If both are offline, we just pick one to advance so the tournament doesn't stall,
			// but they will likely forfeit the next match too.
			this.handleMatchResult(match, match.player1Id);
			return;
		}
		if (p1Offline) {
			console.log(`[TOURNAMENT] Player ${match.player1Id} offline/missing. Auto-win for ${match.player2Id}`);
			this.handleMatchResult(match, match.player2Id!);
			return;
		}
		if (p2Offline) {
			console.log(`[TOURNAMENT] Player ${match.player2Id} offline/missing. Auto-win for ${match.player1Id}`);
			this.handleMatchResult(match, match.player1Id);
			return;
		}

		console.log(`[TOURNAMENT] Starting match ${match.id} between ${match.player1Id} and ${match.player2Id}`);

		const config: Partial<GameConfig> = {
			// You could customize config for tournament (e.g. higher speed)
		};

		const { roomId, room } = this.roomManager.createOnlineGame(match.player1Id, match.player2Id, config);
		// Ensure mode is set to tournament (createOnlineGame defaults to MATCHMAKING)
		// Force update mode for tournament tracking
		(room as any).mode = GameMode.TOURNAMENT;

		match.roomId = roomId;
		match.status = 'in_progress';

		// Emit event so controller can join players to room
		this.emit('matchStarted', {
			roomId,
			matchId: match.id,
			player1Id: match.player1Id,
			player2Id: match.player2Id
		});

		// Listen for game end
		room.once('gameOver', (data) => {
			this.handleMatchResult(match, data.winnerId);
		});

		this.emitStateUpdate();
	}

	private handleMatchResult(match: TournamentMatch, winnerId: string): void {
		console.log(`[TOURNAMENT] Match ${match.id} winner: ${winnerId}`);

		match.status = 'finished';
		match.winnerId = winnerId;
		match.roomId = null; // Clear room reference

		// Advance winner to next match
		if (match.nextMatchId) {
			this.advancePlayerToMatch(match.nextMatchId, winnerId);
		} else {
			// Tournament Winner!
			this.finishTournament(winnerId);
		}

		this.emitStateUpdate();
	}

	private advancePlayerToMatch(nextMatchId: string, winnerId: string): void {
		// Find the next match
		let nextMatch: TournamentMatch | undefined;
		for (const round of this.bracket.rounds) {
			nextMatch = round.matches.find(m => m.id === nextMatchId);
			if (nextMatch) break;
		}

		if (!nextMatch) {
			console.error(`[TOURNAMENT] Next match ${nextMatchId} not found!`);
			return;
		}

		// Slot the winner into the next match
		if (!nextMatch.player1Id) {
			nextMatch.player1Id = winnerId;
		} else if (!nextMatch.player2Id) {
			nextMatch.player2Id = winnerId;
		}

		// If both players are present, schedule it?
		// User requested a 10s delay before the next match starts.
		if (nextMatch.player1Id && nextMatch.player2Id) {
			nextMatch.status = 'scheduled';
			this.emitStateUpdate();

			console.log(`[TOURNAMENT] Match ${nextMatch.id} scheduled to start in 10s`);

			setTimeout(() => {
				// Re-check status to ensure tournament wasn't cancelled/stopped
				if (this.state === TournamentState.IN_PROGRESS && nextMatch && nextMatch.status === 'scheduled') {
					this.startMatch(nextMatch);
				}
			}, 10000);
		}
	}

	private finishTournament(winnerId: string): void {
		console.log(`[TOURNAMENT] Tournament Finished! Winner: ${winnerId}`);
		this.state = TournamentState.FINISHED;
		this.bracket.winnerId = winnerId;
		// Maybe some cleanup or stats recording?
	}

	private emitStateUpdate(): void {
		this.emit('stateUpdate', {
			tournament: this.getData()
		});
	}

	public cleanup(): void {
		// Stop any active games in this tournament
		// This is a rough cleanup
		this.removeAllListeners();
	}
}
