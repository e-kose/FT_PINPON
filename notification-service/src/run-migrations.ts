import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    const db = new Database('./db/notifications.db');

    // Create migrations table if it doesn't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const filename of migrationFiles) {
        // Check if migration has already been executed
        const existingMigration = db.prepare('SELECT * FROM migrations WHERE filename = ?').get(filename);

        if (existingMigration) {
            console.log(`Migration ${filename} already executed, skipping...`);
            continue;
        }

        console.log(`Executing migration: ${filename}`);

        try {
            // Read and execute migration file
            const migrationPath = path.join(migrationsDir, filename);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

            // Execute the migration in a transaction
            const transaction = db.transaction(() => {
                db.exec(migrationSQL);
                db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
            });

            transaction();
            console.log(`Migration ${filename} executed successfully`);
        } catch (error) {
            console.error(`Error executing migration ${filename}:`, error);
            process.exit(1);
        }
    }

    db.close();
    console.log('All migrations completed successfully!');
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
    runMigrations().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}

export { runMigrations };
