import { fail } from "./errors.js";
export function object(body, allowed) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail(400, "A JSON object is required");
  if (Object.keys(body).some((k) => !allowed.includes(k)))
    fail(400, "Request contains unsupported fields");
}
export function text(value, name, max = 150) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${name} must contain 1-${max} characters`);
  return value.trim();
}
export function email(value) {
  const result = text(value, "email", 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "A valid email is required");
  return result;
}
export function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value) > 72
  )
    fail(400, "Password must be at least 8 characters and at most 72 bytes");
  return value;
}
export function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(400, `${name} must be an integer from ${min} to ${max}`);
  return value;
}
export function money(value, name) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 9999.99 ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
  )
    fail(400, `${name} must be 0-9999.99 with at most two decimals`);
  return value;
}
export function choice(value, name, choices) {
  if (!choices.includes(value))
    fail(400, `${name} must be one of ${choices.join(", ")}`);
  return value;
}
export function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || Number(value) > 4294967295)
    fail(400, "Invalid resource id");
  return Number(value);
}
export function uuid(value) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    fail(400, "request_key must be a UUID v4");
  return value.toLowerCase();
}
