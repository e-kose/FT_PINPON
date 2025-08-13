CREATE TABLE IF NOT EXISTS user_security (
    user_id INTEGER PRIMARY KEY,
    last_login_at DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);