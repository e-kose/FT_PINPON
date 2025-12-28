-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- Tournament settings
  format TEXT CHECK(format IN ('single_elimination', 'double_elimination', 'round_robin')) DEFAULT 'single_elimination',
  max_players INTEGER CHECK(max_players IN (4, 8, 16, 32)) NOT NULL,
  current_players INTEGER DEFAULT 0,

  -- Status
  status TEXT CHECK(status IN ('registration', 'in_progress', 'finished', 'cancelled')) DEFAULT 'registration',

  -- Winner
  winner_id INTEGER,
  winner_nickname TEXT,

  -- Timestamps
  created_by INTEGER NOT NULL, -- admin user id
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  finished_at INTEGER,

  -- Settings
  registration_deadline INTEGER,
  best_of INTEGER DEFAULT 1,  -- best of 1, 3, 5

  -- Prize/Info (optional)
  prize_pool TEXT,
  rules TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_created ON tournaments(created_at DESC);
