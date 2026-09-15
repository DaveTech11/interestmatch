import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

/**
 * Minimal .env parser — no third-party dependency required.
 * Supports KEY=VALUE lines, `#` comments, and blank lines.
 * Existing process.env values always win (so real deployment secrets
 * injected by the host/platform are never overridden by a committed file).
 */
function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(join(rootDir, '.env'));

function parseAdminIds(raw) {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n))
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  botToken: process.env.BOT_TOKEN || '',
  botPublicUsername: process.env.BOT_PUBLIC_USERNAME || '',
  menuImageUrl: process.env.MENU_IMAGE_URL || 'https://files.catbox.moe/qd2kor.jfif',
  databasePath: process.env.DATABASE_PATH || './data/interestmatch.db',
  adminIds: parseAdminIds(process.env.ADMIN_IDS),
  enablePlanTiers: (process.env.ENABLE_PLAN_TIERS || 'true') === 'true',
  rootDir,
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.botToken) missing.push('BOT_TOKEN');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`
    );
  }
}
