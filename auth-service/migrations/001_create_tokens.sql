CREATE Table IF NOT EXISTS refresh_tokens(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_refresh_tokens_updated_at
    AFTER UPDATE ON refresh_tokens
    FOR EACH ROW
BEGIN
    UPDATE refresh_tokens 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

