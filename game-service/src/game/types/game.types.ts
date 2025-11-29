// Game types
export type GameMode = 'local' | 'online' | 'tournament';
export type GameStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'cancelled';
export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// JWT Payload
export interface JWTPayload {
  sub: string; // User ID
  username: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface Game {
  id: string;
  game_mode: GameMode;
  player1_id: number | null;
  player1_nickname: string;
  player1_score: number;
  player2_id: number | null;
  player2_nickname: string;
  player2_score: number;
  winner_id: number | null;
  winner_nickname: string | null;
  status: GameStatus;
  tournament_id: string | null;
  tournament_round: number | null;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  duration: number | null;
  max_score: number;
  ball_speed_multiplier: number;
}

export interface GameStats {
  user_id: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  total_score: number;
  total_score_against: number;
  highest_score_in_game: number;
  current_win_streak: number;
  best_win_streak: number;
  rank_points: number;
  rank_tier: RankTier;
  tournaments_played: number;
  tournaments_won: number;
  updated_at: number;
}

export interface MatchmakingQueue {
  id: number;
  user_id: number;
  nickname: string;
  rank_points: number;
  preferred_mode: string;
  joined_at: number;
  last_ping: number;
}

// Tournament types
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type TournamentStatus = 'registration' | 'in_progress' | 'finished' | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  max_players: number;
  current_players: number;
  status: TournamentStatus;
  winner_id: number | null;
  winner_nickname: string | null;
  created_by: number;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  registration_deadline: number | null;
  best_of: number;
  prize_pool: string | null;
  rules: string | null;
}

export interface TournamentParticipant {
  id: number;
  tournament_id: string;
  user_id: number;
  nickname: string;
  seed: number | null;
  current_round: number;
  is_eliminated: number;
  wins: number;
  losses: number;
  joined_at: number;
}
