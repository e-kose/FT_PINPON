// ==========================
// Game Statistics Types
// ==========================

/** Matchmaking Stats */
export interface MatchmakingStats {
  total: number;
  wins: number;
  losses: number;
}

/** Tournament Summary Stats */
export interface TournamentStats {
  total: number;
  wins: number;
}

/** Combined Stats */
export interface GameStats {
  matchmaking: MatchmakingStats;
  tournaments: TournamentStats;
}

// ==========================
// Recent Match Types
// ==========================

export interface MatchPlayer {
  id: string;
  username: string;
  score: number;
}

export interface RecentMatch {
  id: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string;
  playedAt: string;
}

// ==========================
// Recent Tournament Types
// ==========================

export interface TournamentParticipant {
  id: string;
  username: string;
}

export interface TournamentLastMatch {
  round: number;
  opponentId: string;
  opponentUsername: string;
  myScore: number;
  opponentScore: number;
  won: boolean;
  playedAt: string;
}

export interface TournamentMyStats {
  isChampion: boolean;
  totalMatches: number;
  wins: number;
  losses: number;
  eliminatedInRound: number;
  lastMatch: TournamentLastMatch | null;
}

export interface RecentTournament {
  id: string;
  size: number;
  winnerId: string;
  winnerUsername: string;
  participants: TournamentParticipant[];
  myStats: TournamentMyStats;
  finishedAt: string;
}

// ==========================
// User Game Profile (Full Response)
// ==========================

export interface UserGameProfile {
  userId: string;
  username: string;
  stats: GameStats;
  recentMatches: RecentMatch[];
  recentTournaments: RecentTournament[];
}

// ==========================
// API Response Wrapper
// ==========================

export interface UserGameProfileResponse {
  success: boolean;
  data?: UserGameProfile;
  error?: string;
  message?: string;
}
