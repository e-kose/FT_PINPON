-- Games table: Her oyun kaydı (local, online, tournament)
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  game_mode TEXT CHECK(game_mode IN ('local', 'online', 'tournament')) NOT NULL,

  -- Player 1 (authenticated user veya guest)
  player1_id INTEGER,  -- NULL ise guest
  player1_nickname TEXT NOT NULL,
  player1_score INTEGER DEFAULT 0,

  -- Player 2
  player2_id INTEGER,  -- NULL ise guest
  player2_nickname TEXT NOT NULL,
  player2_score INTEGER DEFAULT 0,

  -- Game metadata
  winner_id INTEGER,
  winner_nickname TEXT,
  status TEXT CHECK(status IN ('waiting', 'ready', 'playing', 'finished', 'cancelled')) DEFAULT 'waiting',

  -- Tournament referansı (varsa)
  tournament_id TEXT,
  tournament_round INTEGER,

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  finished_at INTEGER,
  duration INTEGER,  -- seconds

  -- Game settings
  max_score INTEGER DEFAULT 11,
  ball_speed_multiplier REAL DEFAULT 1.0
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_mode ON games(game_mode);
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id) WHERE player1_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id) WHERE player2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
