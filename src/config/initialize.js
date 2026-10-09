import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool } from './database.js';
export async function initialize() {
  const schema = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').filter(s => s.trim())) await pool.query(statement);
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (!existing.length) {
    await pool.execute('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
      [process.env.ADMIN_NAME || 'Shop Admin', email, await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), 'admin']);
  }
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM media');
  if (count === 0 && process.env.SEED_SAMPLE_DATA === 'true') {
    const samples = [
      ['Moonlit Sessions','The Lanterns','music','CD',4,15,5],
      ['Letters from Summer','June Ensemble','music','CD',3,12,5],
      ['Live at the Riverside','The Lanterns','music','DVD',2,20,8],
      ['A Quiet Sunday','Mira Chen','movie','DVD',3,25,10],
      ['The Last Train Home','Arun Lee','movie','DVD',2,30,10],
      ['City Lights Collection','Nora Park','movie','CD',2,18,6],
    ];
    for (const row of samples) await pool.execute('INSERT INTO media (title,creator,category,format,total_copies,daily_fee,daily_late_fee) VALUES (?,?,?,?,?,?,?)',row);
  }
}
