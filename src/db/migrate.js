import { getDb, runMigrations } from './connection.js';
import { logger } from '../utils/logger.js';

const db = getDb();
runMigrations(db);
logger.info('database ready');
