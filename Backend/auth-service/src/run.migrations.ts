import fs from "fs";
import * as dotenv from "dotenv";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/auth.db";
const resDbPath = path.join(__dirname , "../" , dbPath); 
const migrationsDir = __dirname + "/../migrations";

if (!fs.existsSync(path.dirname(resDbPath))) {
  fs.mkdirSync(path.dirname(resDbPath), { recursive: true });
}

const db = new Database(resDbPath);

fs.readdir(migrationsDir, (error, files) => {
  if (error) throw error;

  const sqlFiles = files.filter((file) => file.endsWith(".sql"));

  sqlFiles.forEach((file) => {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    try {
      db.exec(sql);
      console.log(`✅ Migration applied: ${file}`);
    } catch (err) {
      console.error(`Migration failed: ${file}`);
      console.error(err);
    }
  });
});
