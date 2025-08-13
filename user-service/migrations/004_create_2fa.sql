CREATE TABLE IF NOT EXISTS user_2fa (
    user_id INTEGER PRIMARY KEY,
    twofa_enabled BOOLEAN DEFAULT 0,
    twofa_secret TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);