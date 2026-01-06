-- Create tournament_matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  player1_id TEXT NOT NULL,
  player1_username TEXT NOT NULL,
  player1_score INTEGER NOT NULL,
  player2_id TEXT NOT NULL,
  player2_username TEXT NOT NULL,
  player2_score INTEGER NOT NULL,
  winner_id TEXT NOT NULL,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_player1 ON tournament_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_player2 ON tournament_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_played_at ON tournament_matches(played_at DESC);
