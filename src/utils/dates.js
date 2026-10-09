export function today(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDays(date, days) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function lateDays(due, returned) {
  return Math.max(0, Math.round((Date.parse(`${returned}T00:00:00Z`) - Date.parse(`${due}T00:00:00Z`)) / 86400000));
}
export const cents = value => Math.round(Number(value) * 100);
export function rentalView(row, asOf = today()) {
  const daysLate = lateDays(row.due_on, row.returned_on || asOf);
  const late = row.returned_on ? row.late_fee : cents(row.daily_late_fee) * daysLate / 100;
  return { ...row, status: row.returned_on ? 'returned' : daysLate ? 'overdue' : 'active',
    days_late: daysLate, estimated_late_fee: late,
    estimated_total: (cents(row.rental_fee) + cents(late)) / 100 };
}
