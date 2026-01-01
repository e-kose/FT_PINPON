-- Create game_results table for storing matchmaking game results
CREATE TABLE IF NOT EXISTS game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  winner_id TEXT NOT NULL,
  loser_id TEXT NOT NULL,
  winner_score INTEGER NOT NULL,
  loser_score INTEGER NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'matchmaking',
  created_at INTEGER NOT NULL,
  UNIQUE(room_id)
);

-- Create index for faster user stats queries
CREATE INDEX IF NOT EXISTS idx_game_results_winner_id ON game_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_results_loser_id ON game_results(loser_id);
CREATE INDEX IF NOT EXISTS idx_game_results_created_at ON game_results(created_at);
