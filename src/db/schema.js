export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  public_id TEXT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male','female')),
  photo_file_id TEXT,
  bio TEXT DEFAULT '',
  age INTEGER,
  country TEXT,
  region TEXT,
  languages TEXT NOT NULL DEFAULT '[]',   -- JSON array
  goals TEXT NOT NULL DEFAULT '[]',       -- JSON array
  skills TEXT NOT NULL DEFAULT '[]',      -- JSON array
  looking_for TEXT,
  profile_mode TEXT NOT NULL DEFAULT 'public' CHECK (profile_mode IN ('public','limited','invisible')),
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free','plus','pro')),
  trust_score INTEGER NOT NULL DEFAULT 100,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  vip_until TEXT
);


CREATE TABLE IF NOT EXISTS profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, file_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON profile_photos(user_id, sort_order);

CREATE TABLE IF NOT EXISTS interest_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES interest_categories(id),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interests(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_age INTEGER NOT NULL DEFAULT 1,
  show_country INTEGER NOT NULL DEFAULT 1,
  show_interests INTEGER NOT NULL DEFAULT 1,
  allow_profile_views INTEGER NOT NULL DEFAULT 1,
  allow_connections INTEGER NOT NULL DEFAULT 1,
  appear_in_discovery INTEGER NOT NULL DEFAULT 1,
  receive_recommendations INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  new_connection_request INTEGER NOT NULL DEFAULT 1,
  connection_accepted INTEGER NOT NULL DEFAULT 1,
  profile_activity INTEGER NOT NULL DEFAULT 1,
  achievement_unlocked INTEGER NOT NULL DEFAULT 1,
  streak_milestone INTEGER NOT NULL DEFAULT 1,
  high_quality_match INTEGER NOT NULL DEFAULT 1,
  digest_mode INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS profile_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id, created_at);

CREATE TABLE IF NOT EXISTS saved_profiles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, saved_user_id)
);

CREATE TABLE IF NOT EXISTS skipped_profiles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skipped_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, skipped_user_id)
);

CREATE TABLE IF NOT EXISTS hidden_profiles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hidden_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, hidden_user_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT,
  UNIQUE (requester_id, recipient_id)
);


CREATE TABLE IF NOT EXISTS match_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, liked_user_id)
);
CREATE INDEX IF NOT EXISTS idx_match_likes_target ON match_likes(liked_user_id, created_at);

CREATE TABLE IF NOT EXISTS match_passes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, passed_user_id)
);

CREATE TABLE IF NOT EXISTS daily_matches (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_date TEXT NOT NULL,
  matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, match_date)
);

CREATE TABLE IF NOT EXISTS match_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  score INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_match_history_user ON match_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_message_id INTEGER NOT NULL,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sender_id, recipient_id, telegram_message_id, reaction)
);

CREATE TABLE IF NOT EXISTS match_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_age INTEGER,
  max_age INTEGER,
  nearby_only INTEGER NOT NULL DEFAULT 0,
  custom_request TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blocks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_by INTEGER,
  reviewed_at TEXT,
  resolution_note TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL REFERENCES achievements(key),
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_type_time ON analytics_events(event_type, created_at);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action ON rate_limit_events(user_id, action, created_at);

CREATE TABLE IF NOT EXISTS admin_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  sent_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
