-- Game stats: Sadece authenticated users için istatistikler
CREATE TABLE IF NOT EXISTS game_stats (
  user_id INTEGER PRIMARY KEY,

  -- Overall stats
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,

  -- Score stats
  total_score INTEGER DEFAULT 0,
  total_score_against INTEGER DEFAULT 0,
  highest_score_in_game INTEGER DEFAULT 0,

  -- Streaks
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,

  -- Ranked
  rank_points INTEGER DEFAULT 1000,
  rank_tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum, diamond

  -- Tournament stats
  tournaments_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,

  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_stats_rank_points ON game_stats(rank_points DESC);
CREATE INDEX IF NOT EXISTS idx_stats_wins ON game_stats(wins DESC);

