import { pool, transaction } from '../config/database.js';
import { fail } from '../utils/errors.js';
const selection = `SELECT m.*, m.total_copies - (SELECT COUNT(*) FROM rentals r WHERE r.media_id=m.id AND r.returned_on IS NULL) AS available_copies FROM media m`;
export async function listMedia(query, admin) {
  const where = [], values = [];
  if (!admin) where.push('m.archived=FALSE');
  if (query.search) { where.push('m.title LIKE ?'); values.push(`%${query.search}%`); }
  for (const key of ['category','format']) if (query[key]) { where.push(`m.${key}=?`); values.push(query[key]); }
  const [rows] = await pool.execute(`${selection}${where.length ? ' WHERE '+where.join(' AND ') : ''} ORDER BY m.id DESC`, values);
  return rows;
}
export async function getMedia(id, admin = false) {
  const [[row]] = await pool.execute(`${selection} WHERE m.id=?${admin ? '' : ' AND m.archived=FALSE'}`, [id]);
  if (!row) fail(404, 'Media not found');
  return row;
}
export async function createMedia(data) {
  const keys = Object.keys(data);
  const [result] = await pool.execute(`INSERT INTO media (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(data));
  return getMedia(result.insertId, true);
}
export async function updateMedia(id, data) {
  await transaction(async db => {
    const [[row]] = await db.execute('SELECT id FROM media WHERE id=? FOR UPDATE', [id]);
    if (!row) fail(404, 'Media not found');
    const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM rentals WHERE media_id=? AND returned_on IS NULL', [id]);
    if (data.total_copies !== undefined && data.total_copies < count) fail(409, 'Total copies cannot be lower than active rentals');
    if (data.archived === true && count > 0) fail(409, 'Return all active rentals before archiving this media');
    const entries = Object.entries(data);
    await db.execute(`UPDATE media SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`, [...entries.map(([,v]) => v), id]);
  });
  return getMedia(id, true);
}
export async function deleteMedia(id) {
  return transaction(async db => {
    const [[row]] = await db.execute('SELECT id FROM media WHERE id=? FOR UPDATE', [id]);
    if (!row) fail(404, 'Media not found');
    const [history] = await db.execute('SELECT returned_on FROM rentals WHERE media_id=?', [id]);
    if (history.some(r => !r.returned_on)) fail(409, 'Return all active rentals before deleting this media');
    if (history.length) {
      await db.execute('UPDATE media SET archived=TRUE WHERE id=?', [id]);
      return 'Media archived. Rental history retained';
    }
    await db.execute('DELETE FROM media WHERE id=?', [id]);
    return 'Media deleted';
  });
}
