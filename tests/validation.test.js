import { test } from "node:test";
import assert from "node:assert/strict";
import { newPassword, password } from "../src/utils/validation.js";
test("New passwords enforce strength and bcrypt byte limit; login preserves compatibility", () => {
  for (const value of [
    "password123!",
    "PASSWORD123!",
    "Password!!!",
    "Password123",
    "12345678",
    "GoodPass123!".repeat(7),
    "A1!" + "အ".repeat(24),
  ])
    assert.throws(() => newPassword(value), { status: 400 });
  assert.equal(newPassword("GoodPass123!"), "GoodPass123!");
  assert.equal(password("12345678"), "12345678");
});
