import type Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Database after ensuring directory
import Database_Import from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH || "./db/game.db";
const dbDir = path.dirname(dbPath);

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

const db = new Database_Import(dbPath);
db.pragma("journal_mode = WAL");

console.log("Running migrations...");

const migrationsDir = path.join(__dirname, "../migrations");
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = fs.readFileSync(migrationPath, "utf-8");
    db.exec(migration);
    console.log(`✓ Migration executed: ${file}`);
  }

  console.log(`\n✓ All migrations completed successfully!`);
} else {
  console.error(`Migrations directory not found: ${migrationsDir}`);
  process.exit(1);
}

db.close();
console.log("Database connection closed.");
