import bcrypt from 'bcryptjs';
import { pool, transaction } from '../config/database.js';
import { fail } from '../utils/errors.js';
export const publicFields = 'id,name,email,role,active,created_at';
export async function findUser(id) {
  const [[user]] = await pool.execute(`SELECT ${publicFields} FROM users WHERE id=?`, [id]);
  return user;
}
export async function createCustomer(data) {
  const hash = await bcrypt.hash(data.password, 12);
  const [result] = await pool.execute('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [data.name, data.email, hash]);
  return findUser(result.insertId);
}
export async function listCustomers() {
  const [rows] = await pool.query(`SELECT ${publicFields} FROM users WHERE role='customer' ORDER BY id DESC`);
  return rows;
}
export async function getCustomer(id) {
  const user = await findUser(id);
  if (!user || user.role !== 'customer') fail(404, 'Customer not found');
  return user;
}
export async function updateCustomer(id, data) {
  if (data.password) { data.password_hash = await bcrypt.hash(data.password, 12); delete data.password; }
  return transaction(async db => {
    const [[user]] = await db.execute("SELECT id FROM users WHERE id=? AND role='customer' FOR UPDATE", [id]);
    if (!user) fail(404, 'Customer not found');
    const entries = Object.entries(data);
    await db.execute(`UPDATE users SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`, [...entries.map(([,v]) => v), id]);
    const [[updated]] = await db.execute(`SELECT ${publicFields} FROM users WHERE id=?`, [id]);
    return updated;
  });
}
export async function deleteCustomer(id) {
  return transaction(async db => {
    const [[user]] = await db.execute("SELECT id FROM users WHERE id=? AND role='customer' FOR UPDATE", [id]);
    if (!user) fail(404, 'Customer not found');
    const [history] = await db.execute('SELECT returned_on FROM rentals WHERE customer_id=?', [id]);
    if (history.some(r => !r.returned_on)) fail(409, 'Return all active rentals before deleting this customer');
    if (history.length) {
      await db.execute('UPDATE users SET active=FALSE WHERE id=?', [id]);
      return 'Customer deactivated. Rental history retained';
    }
    await db.execute('DELETE FROM users WHERE id=?', [id]);
    return 'Customer deleted';
  });
}
