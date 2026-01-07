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
	private queues: Map<TournamentSize, Map<string, string>> = new Map([
		[4, new Map()],
		[8, new Map()]
	]);

	constructor(roomManager: RoomManager) {
		super();
		this.roomManager = roomManager;
	}

	public createTournament(size: TournamentSize): Tournament {
		const id = `tour-${randomUUID()}`;
		const tournament = new Tournament(id, size, this.roomManager);

		this.tournaments.set(id, tournament);

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

		tournament.on('tournamentFinished', (tournamentData) => {
			this.emit('tournamentFinished', {
				tournamentId: id,
				tournamentData
			});
		});

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

	public joinTournament(tournamentId: string, userId: string, username: string): Tournament | null {
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament) return null;

		const success = tournament.addPlayer(userId, username);
		if (!success) return null;

		return tournament;
	}

	public leaveTournament(tournamentId: string, userId: string): void {
		const tournament = this.tournaments.get(tournamentId);
		if (tournament) {
			tournament.removePlayer(userId, true);
			if (tournament.getPlayers().length === 0) {
				this.deleteTournament(tournamentId);
			}
		}
	}

	public joinQueue(userId: string, username: string, size: TournamentSize): { success: boolean, waiting: number } {
		if (!this.queues.has(size)) return { success: false, waiting: 0 };

		this.leaveQueue(userId);

		const queue = this.queues.get(size)!;
		queue.set(userId, username);

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
			const playerEntries = Array.from(queue.entries()).slice(0, size);

			playerEntries.forEach(([userId]) => queue.delete(userId));

			const tournament = this.createTournament(size);
			console.log(`[TOURNAMENT_QUEUE] Auto-creating tournament ${tournament.id} for ${size} players`);

			playerEntries.forEach(([userId, username]) => {
				tournament.addPlayer(userId, username);
			});

			this.emit('tournamentStarted', {
				tournamentId: tournament.id,
				players: playerEntries.map(([userId]) => userId),
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
