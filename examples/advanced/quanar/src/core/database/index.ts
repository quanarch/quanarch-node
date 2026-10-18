import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { appConfig } from '../../config';

fs.mkdirSync(path.dirname(appConfig.databaseFile), { recursive: true });

/** The quanar's one database connection. Quans never see it; they send operations. */
export const database = new DatabaseSync(appConfig.databaseFile);
// WAL with synchronous NORMAL: a crash of the process loses nothing; only a power cut may
// lose the last commit. FULL would wait for the disk on every write.
database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 3000;');
