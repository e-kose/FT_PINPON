import type Database from "better-sqlite3";
import type { Tournament, TournamentParticipant, TournamentFormat, TournamentStatus } from "../types/game.types.js";
import { nanoid } from "nanoid";

export class TournamentRepository {
  constructor(private db: Database.Database) {}

  create(tournament: Partial<Tournament>): Tournament {
    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO tournaments (
        id, name, description, format, max_players, created_by, created_at,
        registration_deadline, best_of, prize_pool, rules, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      tournament.name,
      tournament.description || null,
      tournament.format || 'single_elimination',
      tournament.max_players,
      tournament.created_by,
      now,
      tournament.registration_deadline || null,
      tournament.best_of || 1,
      tournament.prize_pool || null,
      tournament.rules || null,
      'registration'
    );

    return this.findById(id)!;
  }

  findById(id: string): Tournament | undefined {
    const stmt = this.db.prepare('SELECT * FROM tournaments WHERE id = ?');
    return stmt.get(id) as Tournament | undefined;
  }

  findAll(filters?: { status?: TournamentStatus; limit?: number; offset?: number }): Tournament[] {
    let query = 'SELECT * FROM tournaments WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Tournament[];
  }

  updateStatus(id: string, status: TournamentStatus): void {
    const now = Math.floor(Date.now() / 1000);
    let stmt;

    if (status === 'in_progress') {
      stmt = this.db.prepare('UPDATE tournaments SET status = ?, started_at = ? WHERE id = ?');
      stmt.run(status, now, id);
    } else if (status === 'finished') {
      stmt = this.db.prepare('UPDATE tournaments SET status = ?, finished_at = ? WHERE id = ?');
      stmt.run(status, now, id);
    } else {
      stmt = this.db.prepare('UPDATE tournaments SET status = ? WHERE id = ?');
      stmt.run(status, id);
    }
  }

  incrementPlayerCount(id: string): void {
    const stmt = this.db.prepare('UPDATE tournaments SET current_players = current_players + 1 WHERE id = ?');
    stmt.run(id);
  }

  setWinner(id: string, winnerId: number, winnerNickname: string): void {
    const stmt = this.db.prepare(`
      UPDATE tournaments
      SET winner_id = ?, winner_nickname = ?, status = 'finished', finished_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(winnerId, winnerNickname, id);
  }

  // Participant methods
  addParticipant(tournamentId: string, userId: number, nickname: string): TournamentParticipant {
    const stmt = this.db.prepare(`
      INSERT INTO tournament_participants (tournament_id, user_id, nickname)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(tournamentId, userId, nickname);
    return this.findParticipantById(Number(result.lastInsertRowid))!;
  }

  findParticipantById(id: number): TournamentParticipant | undefined {
    const stmt = this.db.prepare('SELECT * FROM tournament_participants WHERE id = ?');
    return stmt.get(id) as TournamentParticipant | undefined;
  }

  findParticipants(tournamentId: string): TournamentParticipant[] {
    const stmt = this.db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY seed ASC');
    return stmt.all(tournamentId) as TournamentParticipant[];
  }

  findParticipantByUser(tournamentId: string, userId: number): TournamentParticipant | undefined {
    const stmt = this.db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?');
    return stmt.get(tournamentId, userId) as TournamentParticipant | undefined;
  }

  assignSeeds(tournamentId: string): void {
    const participants = this.findParticipants(tournamentId);
    const stmt = this.db.prepare('UPDATE tournament_participants SET seed = ? WHERE id = ?');

    participants.forEach((participant, index) => {
      stmt.run(index + 1, participant.id);
    });
  }

  eliminateParticipant(participantId: number): void {
    const stmt = this.db.prepare('UPDATE tournament_participants SET is_eliminated = 1 WHERE id = ?');
    stmt.run(participantId);
  }

  updateParticipantStats(participantId: number, won: boolean): void {
    const column = won ? 'wins' : 'losses';
    const stmt = this.db.prepare(`UPDATE tournament_participants SET ${column} = ${column} + 1 WHERE id = ?`);
    stmt.run(participantId);
  }
}
