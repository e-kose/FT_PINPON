-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  size INTEGER NOT NULL CHECK (size IN (4, 8)),
  winner_id TEXT NOT NULL,
  winner_username TEXT NOT NULL,
  participants TEXT NOT NULL,
  finished_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tournaments_finished_at ON tournaments(finished_at DESC);
