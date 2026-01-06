-- Create matchmaking_matches table
CREATE TABLE IF NOT EXISTS matchmaking_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id TEXT NOT NULL,
  player1_username TEXT NOT NULL,
  player1_score INTEGER NOT NULL,
  player2_id TEXT NOT NULL,
  player2_username TEXT NOT NULL,
  player2_score INTEGER NOT NULL,
  winner_id TEXT NOT NULL,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_player1 ON matchmaking_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_player2 ON matchmaking_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_played_at ON matchmaking_matches(played_at DESC);
