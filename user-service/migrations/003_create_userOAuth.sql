CREATE TABLE IF NOT EXISTS user_oauth (
    user_id INTEGER PRIMARY KEY,
    oauth_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);