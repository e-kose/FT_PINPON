-- Matchmaking queue: Online mode için oyuncu kuyruğu
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  rank_points INTEGER DEFAULT 1000,

  -- Matchmaking preferences (future use)
  preferred_mode TEXT DEFAULT 'ranked',

  joined_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_ping INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Index for matchmaking algorithm
CREATE INDEX IF NOT EXISTS idx_matchmaking_rank ON matchmaking_queue(rank_points);
CREATE INDEX IF NOT EXISTS idx_matchmaking_joined ON matchmaking_queue(joined_at);
