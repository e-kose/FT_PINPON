-- Game invites table (chat service'ten gelen davetler)
CREATE TABLE IF NOT EXISTS game_invites (
  id TEXT PRIMARY KEY,

  -- Davet eden ve edilen
  from_user_id INTEGER NOT NULL,
  from_nickname TEXT NOT NULL,
  to_user_id INTEGER NOT NULL,
  to_nickname TEXT,

  -- Oyun tercihleri
  max_score INTEGER DEFAULT 11,

  -- Durum
  status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')) DEFAULT 'pending',

  -- Eğer kabul edildiyse oluşturulan oyun
  game_id TEXT,

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  responded_at INTEGER,
  expires_at INTEGER, -- Daveti ne zaman geçersiz sayacağız

  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_invites_to_user ON game_invites(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_invites_from_user ON game_invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invites_status ON game_invites(status);
