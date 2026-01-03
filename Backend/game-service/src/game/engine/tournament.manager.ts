/**
 * Tournament Manager
 * Manages all active tournaments
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { Tournament } from './tournament.js';
import { RoomManager } from './room.manager.js';
import type { TournamentSize } from '../types/tournament.types.js';

export class TournamentManager extends EventEmitter {
	private tournaments: Map<string, Tournament> = new Map();
	private roomManager: RoomManager;
	private queues: Map<TournamentSize, Set<string>> = new Map([
		[4, new Set()],
		[8, new Set()]
	]);

	constructor(roomManager: RoomManager) {
		super();
		this.roomManager = roomManager;
	}

	public createTournament(size: TournamentSize): Tournament {
		const id = `tour-${randomUUID()}`;
		const tournament = new Tournament(id, size, this.roomManager);

		this.tournaments.set(id, tournament);

		// Relay tournament events
		tournament.on('stateUpdate', (data) => {
			this.emit('tournamentUpdate', {
				tournamentId: id,
				data: data
			});
		});

		tournament.on('matchStarted', (data) => {
			this.emit('tournamentMatchStarted', {
				tournamentId: id,
				...data
			});
		});

		// Auto-cleanup finished tournaments
		tournament.on('stateUpdate', (data) => {
			if (data.state === 'finished') {
				console.log(`[TOURNAMENT_MANAGER] Tournament ${id} finished. Scheduling cleanup in 5s.`);
				setTimeout(() => {
					if (this.tournaments.has(id)) {
						console.log(`[TOURNAMENT_MANAGER] Auto-cleaning finished tournament ${id}`);
						this.deleteTournament(id);
					}
				}, 5000);
			}
		});

		return tournament;
	}

	public joinTournament(tournamentId: string, userId: string): Tournament | null {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) return null;

		const success = tournament.addPlayer(userId);
		if (!success) return null;

		return tournament;
	}

	public leaveTournament(tournamentId: string, userId: string): void {
		const tournament = this.tournaments.get(tournamentId);
		if (tournament) {
			tournament.removePlayer(userId, true);
			// If empty, maybe delete?
			if (tournament.getPlayers().length === 0) {
				this.deleteTournament(tournamentId);
			}
		}
	}

	public joinQueue(userId: string, size: TournamentSize): { success: boolean, waiting: number } {
		if (!this.queues.has(size)) return { success: false, waiting: 0 };

		// Remove from other queues first
		this.leaveQueue(userId);

		const queue = this.queues.get(size)!;
		queue.add(userId);

		this.checkQueue(size);

		return { success: true, waiting: queue.size };
	}

	public leaveQueue(userId: string): void {
		this.queues.forEach(queue => queue.delete(userId));
	}

	private checkQueue(size: TournamentSize): void {
		const queue = this.queues.get(size);
		if (!queue) return;

		if (queue.size >= size) {
			// Create tournament
			const players = Array.from(queue).slice(0, size);

			// Remove players from queue
			players.forEach(p => queue.delete(p));

			const tournament = this.createTournament(size);
			console.log(`[TOURNAMENT_QUEUE] Auto-creating tournament ${tournament.id} for ${size} players`);

			// Add players to tournament
			players.forEach(userId => {
				tournament.addPlayer(userId);
			});

			// Events are already relayed by createTournament -> tournamentUpdate
			// Players will receive TOURNAMENT_STATE via the generic broadcast if they are subscribed?
			// Actually, we need to notify these specific players that they joined a tournament so they can subscribe!
			// We can emit a special event for this.

			this.emit('tournamentStarted', {
				tournamentId: tournament.id,
				players: players,
				size: size
			});
		}
	}

	public getTournament(tournamentId: string): Tournament | undefined {
		return this.tournaments.get(tournamentId);
	}

	public getTournamentByPlayer(userId: string): Tournament | undefined {
		for (const tournament of this.tournaments.values()) {
			const player = tournament.getPlayer(userId);
			if (player && !player.exited) {
				return tournament;
			}
		}
		return undefined;
	}

	public deleteTournament(tournamentId: string): void {
		const tournament = this.tournaments.get(tournamentId);
		if (tournament) {
			tournament.cleanup();
			this.tournaments.delete(tournamentId);
		}
	}

	public cleanup(): void {
		for (const tournament of this.tournaments.values()) {
			tournament.cleanup();
		}
		this.tournaments.clear();
	}
}
