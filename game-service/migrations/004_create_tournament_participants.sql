-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  nickname TEXT NOT NULL,

  seed INTEGER,  -- bracket pozisyonu (1, 2, 3, ...)
  current_round INTEGER DEFAULT 0,
  is_eliminated INTEGER DEFAULT 0,

  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,

  joined_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_seed ON tournament_participants(tournament_id, seed);
