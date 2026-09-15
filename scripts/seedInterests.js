import { getDb, runMigrations } from '../src/db/connection.js';
import { CATEGORIES, INTERESTS } from '../src/domain/interestCatalogData.js';
import { logger } from '../src/utils/logger.js';

const db = getDb();
runMigrations(db);

const insertCategory = db.prepare(
  `INSERT INTO interest_categories (id, name, emoji, sort_order)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, sort_order=excluded.sort_order`
);
const insertInterest = db.prepare(
  `INSERT INTO interests (id, name, emoji, category_id, active)
   VALUES (?, ?, ?, ?, 1)
   ON CONFLICT(id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, category_id=excluded.category_id`
);

db.exec('BEGIN');
try {
  for (const c of CATEGORIES) insertCategory.run(c.id, c.name, c.emoji, c.sort_order);
  for (const i of INTERESTS) insertInterest.run(i.id, i.name, i.emoji, i.category_id);
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

logger.info('interest catalog seeded', {
  categories: CATEGORIES.length,
  interests: INTERESTS.length,
});
