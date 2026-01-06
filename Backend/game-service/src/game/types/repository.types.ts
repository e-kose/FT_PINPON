export interface MatchmakingMatch {
  id: number;
  player1_id: string;
  player1_username: string;
  player1_score: number;
  player2_id: string;
  player2_username: string;
  player2_score: number;
  winner_id: string;
  played_at: string;
}

export interface TournamentParticipant {
  id: string;
  username: string;
}

export interface Tournament {
  id: string;
  size: number;
  winner_id: string;
  winner_username: string;
  participants: string;
  finished_at: string;
}

export interface TournamentMatch {
  id: number;
  tournament_id: string;
  round: number;
  player1_id: string;
  player1_username: string;
  player1_score: number;
  player2_id: string;
  player2_username: string;
  player2_score: number;
  winner_id: string;
  played_at: string;
}

export interface SaveMatchmakingMatchInput {
  player1Id: string;
  player1Username: string;
  player1Score: number;
  player2Id: string;
  player2Username: string;
  player2Score: number;
  winnerId: string;
}

export interface SaveTournamentInput {
  id: string;
  size: number;
  winnerId: string;
  winnerUsername: string;
  participants: TournamentParticipant[];
}

export interface SaveTournamentMatchInput {
  tournamentId: string;
  round: number;
  player1Id: string;
  player1Username: string;
  player1Score: number;
  player2Id: string;
  player2Username: string;
  player2Score: number;
  winnerId: string;
}
