import mysql from 'mysql2/promise';
import 'dotenv/config';
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'alive', password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'alive_rental', connectionLimit: 10,
  dateStrings: true, decimalNumbers: true, timezone: 'Z',
});
export async function transaction(work) {
  const db = await pool.getConnection();
  try {
    await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await db.beginTransaction();
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally { db.release(); }
}
