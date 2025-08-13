CREATE TRIGGER IF NOT EXISTS update_refresh_tokens_updated_at
    AFTER UPDATE ON refresh_tokens
    FOR EACH ROW
BEGIN
    UPDATE refresh_tokens 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

