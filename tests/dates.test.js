import { test } from "node:test";
import assert from "node:assert/strict";
import { today, addDays, lateDays, rentalView } from "../src/utils/dates.js";
test("Bangkok midnight, month and leap-year boundaries", () => {
  assert.equal(today(new Date("2026-10-09T16:59:00Z")), "2026-10-09");
  assert.equal(today(new Date("2026-10-09T17:00:00Z")), "2026-10-10");
  assert.equal(addDays("2028-02-28", 2), "2028-03-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
test("No fine on due date; future, overdue and returned totals", () => {
  assert.equal(lateDays("2026-10-09", "2026-10-09"), 0);
  assert.equal(lateDays("2026-10-10", "2026-10-09"), 0);
  const row = {
    due_on: "2026-10-09",
    returned_on: null,
    daily_late_fee: 0.1,
    rental_fee: 1.2,
  };
  assert.equal(rentalView(row, "2026-10-12").estimated_total, 1.5);
  assert.equal(
    rentalView(
      { ...row, returned_on: "2026-10-11", late_fee: 0.2 },
      "2026-10-30",
    ).estimated_total,
    1.4,
  );
});
