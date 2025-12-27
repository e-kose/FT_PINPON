-- Tournament matches (bracket maçları)
CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,

  -- Tur bilgisi: quarter_final, semi_final, final, third_place
  round TEXT NOT NULL,
  match_order INTEGER NOT NULL, -- Aynı turdaki sıra (1, 2, 3, 4 for QF)

  -- Oyuncular (alias bazlı, User Management olmadan çalışır)
  player1_alias TEXT,
  player2_alias TEXT,

  -- Opsiyonel: Eğer User Management varsa
  player1_id INTEGER,
  player2_id INTEGER,

  -- Kazanan
  winner_alias TEXT,
  winner_id INTEGER,

  -- Skor
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,

  -- Maç durumu
  status TEXT CHECK(status IN ('pending', 'ready', 'active', 'finished', 'cancelled')) DEFAULT 'pending',

  -- İlişkili oyun (GameService tarafından oluşturulan)
  game_id TEXT,

  -- Bir üst turdaki hedef maç (kazanan buraya gider)
  next_match_id TEXT,
  next_match_slot TEXT CHECK(next_match_slot IN ('player1', 'player2')),

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  finished_at INTEGER,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  FOREIGN KEY (next_match_id) REFERENCES tournament_matches(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);
