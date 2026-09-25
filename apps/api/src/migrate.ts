import fs from 'node:fs/promises'; import path from 'node:path'; import {fileURLToPath} from 'node:url'; import {q,pool} from './db.js';
const root=path.dirname(fileURLToPath(import.meta.url)); const sql=await fs.readFile(path.resolve(root,'../../../infra/schema.sql'),'utf8'); await q(sql); console.log('WAEVE schema applied'); await pool.end();
