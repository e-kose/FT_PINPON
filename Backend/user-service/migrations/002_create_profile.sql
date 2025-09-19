CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
BEGIN
    UPDATE users_profiles
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;