import fastifyPlugin from "fastify-plugin";
import Database from "better-sqlite3";
import type { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPlug = fastifyPlugin(async (fastify: FastifyInstance) => {
  const dbPath = process.env.DATABASE_PATH || "./db/game.db";
  const dbDir = path.dirname(dbPath);

  // Ensure db directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Run migrations
  const migrationsDir = path.join(__dirname, "../../migrations");
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(migrationPath, "utf-8");
      db.exec(migration);
      fastify.log.info(`Migration executed: ${file}`);
    }
  }

  fastify.decorate("db", db);

  fastify.addHook("onClose", (instance, done) => {
    db.close();
    done();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}
