import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '../config/env.js';
import { SCHEMA_SQL } from './schema.js';
import { logger } from '../utils/logger.js';

let dbInstance = null;

/**
 * Returns a singleton SQLite connection. Uses Node's built-in `node:sqlite`
 * module (stable-enough, zero-dependency) so `npm install` never has to
 * compile a native addon — a common source of pain on Windows.
 */
export function getDb(path = env.databasePath) {
  if (dbInstance) return dbInstance;
  if (path !== ':memory:') {
    const dir = dirname(path);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  dbInstance = new DatabaseSync(path);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  logger.info('sqlite connection opened', { path });
  return dbInstance;
}

export function runMigrations(db = getDb()) {
  db.exec(SCHEMA_SQL);
  // Additive migrations for databases created by older InterestMatch versions.
  const addColumn = (sql) => { try { db.exec(sql); } catch (err) { if (!String(err?.message || err).toLowerCase().includes('duplicate column')) throw err; } };
  addColumn("ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male','female'))");
  addColumn("ALTER TABLE users ADD COLUMN photo_file_id TEXT");
  addColumn("ALTER TABLE users ADD COLUMN last_active_at TEXT");
  addColumn("ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0");
  addColumn("ALTER TABLE users ADD COLUMN vip_until TEXT");
  db.exec(`CREATE TABLE IF NOT EXISTS profile_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, file_id TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, file_id)); CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON profile_photos(user_id, sort_order);`);
  db.exec(`CREATE TABLE IF NOT EXISTS match_preferences (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, min_age INTEGER, max_age INTEGER, nearby_only INTEGER NOT NULL DEFAULT 0, custom_request TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  db.exec(`CREATE TABLE IF NOT EXISTS match_likes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, liked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, is_super INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, liked_user_id))`);
  db.exec(`CREATE TABLE IF NOT EXISTS match_passes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, passed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, passed_user_id))`);
  db.exec(`CREATE TABLE IF NOT EXISTS daily_matches (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, match_date TEXT NOT NULL, matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, match_date))`);
  addColumn("ALTER TABLE reports ADD COLUMN reviewed_by INTEGER");
  addColumn("ALTER TABLE reports ADD COLUMN reviewed_at TEXT");
  addColumn("ALTER TABLE reports ADD COLUMN resolution_note TEXT");
  logger.info('migrations applied');
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
