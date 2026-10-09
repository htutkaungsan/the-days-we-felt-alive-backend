import { pool, transaction } from '../config/database.js';
import { fail } from '../utils/errors.js';
import { today, addDays, lateDays, cents, rentalView } from '../utils/dates.js';
const selection = `SELECT r.*,m.title,m.creator,m.category,m.format,u.name AS customer_name,u.email AS customer_email FROM rentals r JOIN media m ON m.id=r.media_id JOIN users u ON u.id=r.customer_id`;
export async function listRentals(user) {
  const [rows] = await pool.execute(`${selection}${user.role === 'admin' ? '' : ' WHERE r.customer_id=?'} ORDER BY r.id DESC`, user.role === 'admin' ? [] : [user.id]);
  return rows.map(r => rentalView(r));
}
export async function getRental(id, user) {
  const [[row]] = await pool.execute(`${selection} WHERE r.id=?`, [id]);
  if (!row) fail(404, 'Rental not found');
  if (user.role !== 'admin' && row.customer_id !== user.id) fail(403, 'You cannot access another customer rental');
  return rentalView(row);
}
export async function createRental(customerId, data) {
  const result = await transaction(async db => {
    // Always lock the customer before media. This also serializes request-key retries.
    const [[user]] = await db.execute("SELECT id,active FROM users WHERE id=? AND role='customer' FOR UPDATE", [customerId]);
    if (!user || !user.active) fail(403, 'Customer account is inactive');
    const [[existing]] = await db.execute('SELECT * FROM rentals WHERE customer_id=? AND request_key=?', [customerId,data.request_key]);
    if (existing) {
      if (existing.media_id !== data.media_id || existing.rental_days !== data.days) fail(409, 'This request key was already used for a different rental');
      return { id: existing.id, replayed: true };
    }
    const [[media]] = await db.execute('SELECT * FROM media WHERE id=? FOR UPDATE', [data.media_id]);
    if (!media || media.archived) fail(404, 'Media not found');
    const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM rentals WHERE media_id=? AND returned_on IS NULL', [data.media_id]);
    if (count >= media.total_copies) fail(409, 'No copies available');
    const rented = today(), due = addDays(rented, data.days);
    const fee = cents(media.daily_fee) * data.days / 100;
    const [inserted] = await db.execute('INSERT INTO rentals (customer_id,media_id,request_key,rental_days,rented_on,due_on,daily_fee,daily_late_fee,rental_fee,total) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [customerId,data.media_id,data.request_key,data.days,rented,due,media.daily_fee,media.daily_late_fee,fee,fee]);
    return { id: inserted.insertId, replayed: false };
  });
  return { rental: await getRental(result.id, { id: customerId, role:'customer' }), replayed: result.replayed };
}
export async function returnRental(id, admin) {
  await transaction(async db => {
    const [[rental]] = await db.execute('SELECT * FROM rentals WHERE id=? FOR UPDATE', [id]);
    if (!rental) fail(404, 'Rental not found');
    if (rental.returned_on) return;
    const returned = today();
    const late = lateDays(rental.due_on, returned) * cents(rental.daily_late_fee) / 100;
    const total = (cents(rental.rental_fee) + cents(late)) / 100;
    await db.execute('UPDATE rentals SET returned_on=?,late_fee=?,total=? WHERE id=?', [returned,late,total,id]);
  });
  return getRental(id, admin);
}
