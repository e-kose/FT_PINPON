import BetterSqlite3 from "better-sqlite3";
import type {
  SaveMatchmakingMatchInput,
  SaveTournamentInput,
  SaveTournamentMatchInput,
  MatchmakingMatch,
  Tournament,
  TournamentMatch,
  TournamentParticipant,
} from "../types/repository.types.js";

export class GameRepository {
  db: BetterSqlite3.Database;

  constructor(db: BetterSqlite3.Database) {
    this.db = db;
  }

  saveMatchmakingMatch(match: SaveMatchmakingMatchInput) {
    const stmt = this.db.prepare(
      `INSERT INTO matchmaking_matches
       (player1_id, player1_username, player1_score, player2_id, player2_username, player2_score, winner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      match.player1Id,
      match.player1Username,
      match.player1Score,
      match.player2Id,
      match.player2Username,
      match.player2Score,
      match.winnerId
    );
    return info.lastInsertRowid;
  }

  getUserMatchmakingMatches(userId: string, limit: number = 10) {
    const stmt = this.db.prepare(
      `SELECT * FROM matchmaking_matches
       WHERE player1_id = ? OR player2_id = ?
       ORDER BY played_at DESC
       LIMIT ?`
    );
    return stmt.all(userId, userId, limit) as MatchmakingMatch[];
  }

  getMatchmakingStats(userId: string) {
    const stmt = this.db.prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
         SUM(CASE WHEN winner_id != ? THEN 1 ELSE 0 END) as losses
       FROM matchmaking_matches
       WHERE player1_id = ? OR player2_id = ?`
    );
    return stmt.get(userId, userId, userId, userId) as {
      total: number;
      wins: number;
      losses: number;
    };
  }

  saveTournament(tournament: SaveTournamentInput) {
    const stmt = this.db.prepare(
      `INSERT INTO tournaments (id, size, winner_id, winner_username, participants)
       VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      tournament.id,
      tournament.size,
      tournament.winnerId,
      tournament.winnerUsername,
      JSON.stringify(tournament.participants)
    );
    return info.changes;
  }

  saveTournamentMatch(match: SaveTournamentMatchInput) {
    const stmt = this.db.prepare(
      `INSERT INTO tournament_matches
       (tournament_id, round, player1_id, player1_username, player1_score,
        player2_id, player2_username, player2_score, winner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      match.tournamentId,
      match.round,
      match.player1Id,
      match.player1Username,
      match.player1Score,
      match.player2Id,
      match.player2Username,
      match.player2Score,
      match.winnerId
    );
    return info.lastInsertRowid;
  }

  getTournamentById(tournamentId: string) {
    const tournamentStmt = this.db.prepare(
      `SELECT * FROM tournaments WHERE id = ?`
    );
    const tournament = tournamentStmt.get(tournamentId) as Tournament | undefined;

    if (!tournament) return null;

    const matchesStmt = this.db.prepare(
      `SELECT * FROM tournament_matches
       WHERE tournament_id = ?
       ORDER BY round, played_at`
    );
    const matches = matchesStmt.all(tournamentId) as TournamentMatch[];

    return {
      ...tournament,
      participants: JSON.parse(tournament.participants) as TournamentParticipant[],
      matches,
    };
  }

  getUserTournaments(userId: string, limit: number = 10) {
    const stmt = this.db.prepare(
      `SELECT * FROM tournaments
       WHERE participants LIKE ?
       ORDER BY finished_at DESC
       LIMIT ?`
    );
    const tournaments = stmt.all(`%"id":"${userId}"%`, limit) as Tournament[];

    return tournaments.map((t) => {
      const matchesStmt = this.db.prepare(
        `SELECT * FROM tournament_matches
         WHERE tournament_id = ?
         ORDER BY round, played_at`
      );
      const matches = matchesStmt.all(t.id) as TournamentMatch[];

      return {
        ...t,
        participants: JSON.parse(t.participants) as TournamentParticipant[],
        matches,
      };
    });
  }

  getTournamentStats(userId: string) {
    const stmt = this.db.prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins
       FROM tournaments
       WHERE participants LIKE ?`
    );
    return stmt.get(userId, `%"id":"${userId}"%`) as {
      total: number;
      wins: number;
    };
  }

  getUserProfile(userId: string) {
    const matchmakingStats = this.getMatchmakingStats(userId);
    const tournamentStats = this.getTournamentStats(userId);
    const recentMatches = this.getUserMatchmakingMatches(userId, 10);
    const recentTournaments = this.getUserTournaments(userId, 10);

    let username = userId;
    if (recentMatches.length > 0) {
      const firstMatch = recentMatches[0]!;
      username =
        firstMatch.player1_id === userId
          ? firstMatch.player1_username
          : firstMatch.player2_username;
    } else if (recentTournaments.length > 0) {
      const participant = recentTournaments[0]!.participants.find(
        (p) => p.id === userId
      );
      username = participant?.username || userId;
    }

    return {
      userId,
      username,
      stats: {
        matchmaking: {
          total: matchmakingStats.total || 0,
          wins: matchmakingStats.wins || 0,
          losses: matchmakingStats.losses || 0,
        },
        tournaments: {
          total: tournamentStats.total || 0,
          wins: tournamentStats.wins || 0,
        },
      },
      recentMatches: recentMatches.map((m) => ({
        id: m.id.toString(),
        player1: {
          id: m.player1_id,
          username: m.player1_username,
          score: m.player1_score,
        },
        player2: {
          id: m.player2_id,
          username: m.player2_username,
          score: m.player2_score,
        },
        winnerId: m.winner_id,
        playedAt: m.played_at,
      })),
      recentTournaments: recentTournaments
        .map((t) => {
          const myMatches = t.matches.filter(
            (m) => m.player1_id === userId || m.player2_id === userId
          );

          if (myMatches.length === 0) {
            return null;
          }

        const wins = myMatches.filter((m) => m.winner_id === userId).length;
        const losses = myMatches.length - wins;
        const isChampion = t.winner_id === userId;
        const lastMatch = myMatches.sort((a, b) => b.round - a.round)[0]!;
        const eliminatedInRound = isChampion ? null : lastMatch.round;
        const isPlayer1 = lastMatch.player1_id === userId;

        return {
          id: t.id,
          size: t.size,
          winnerId: t.winner_id,
          winnerUsername: t.winner_username,
          participants: t.participants,
          myStats: {
            isChampion,
            totalMatches: myMatches.length,
            wins,
            losses,
            eliminatedInRound,
            lastMatch: {
              round: lastMatch.round,
              opponentId: isPlayer1 ? lastMatch.player2_id : lastMatch.player1_id,
              opponentUsername: isPlayer1
                ? lastMatch.player2_username
                : lastMatch.player1_username,
              myScore: isPlayer1 ? lastMatch.player1_score : lastMatch.player2_score,
              opponentScore: isPlayer1
                ? lastMatch.player2_score
                : lastMatch.player1_score,
              won: lastMatch.winner_id === userId,
              playedAt: lastMatch.played_at,
            },
          },
          finishedAt: t.finished_at,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    };
  }
}
