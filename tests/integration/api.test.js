import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
// This suite uses a disposable database and refuses to run against any other name.
Object.assign(process.env, {
  DB_HOST: "127.0.0.1",
  DB_PORT: "3308",
  DB_NAME: "alive_test",
  DB_USER: "alive",
  DB_PASSWORD: "test-password",
  JWT_SECRET: "test-secret-only-32-characters-minimum-123456",
  ADMIN_EMAIL: "admin@test.example",
  ADMIN_PASSWORD: "TestAdmin123!",
  SEED_SAMPLE_DATA: "false",
});
const { app } = await import("../../src/app.js");
const { pool } = await import("../../src/config/database.js");
const { initialize } = await import("../../src/config/initialize.js");
const { today, addDays } = await import("../../src/utils/dates.js");
const { default: jwt } = await import("jsonwebtoken");
const api = request(app);
let admin, customer, other, userId, mediaId, rentalId;
const authorize = (method, path, token) =>
  api[method]("/api/v1" + path).set("Authorization", "Bearer " + token);
before(async () => {
  assert.equal(process.env.DB_NAME, "alive_test");
  await initialize();
  await pool.query("DELETE FROM rentals");
  await pool.query("DELETE FROM media");
  await pool.query("DELETE FROM users WHERE role='customer'");
  admin = (
    await api
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.example", password: "TestAdmin123!" })
      .expect(200)
  ).body.data.token;
});
after(async () => {
  await pool.end();
});
test("Registration, validation, password filtering and authorization", async () => {
  await api
    .post("/api/v1/auth/register")
    .send({
      name: "Eve",
      email: "eve@example.com",
      password: "Password123!",
      role: "admin",
    })
    .expect(400);
  await api
    .post("/api/v1/auth/register")
    .send({ name: "Eve", email: "bad", password: "short" })
    .expect(400);
  const response = await api
    .post("/api/v1/auth/register")
    .send({ name: "Eve", email: "eve@example.com", password: "Password123!" })
    .expect(201);
  userId = response.body.data.id;
  assert.equal(response.body.data.role, "customer");
  assert.ok(!JSON.stringify(response.body).includes("password"));
  await api
    .post("/api/v1/auth/register")
    .send({ name: "Eve", email: "EVE@example.com", password: "Password123!" })
    .expect(409);
  await api
    .post("/api/v1/auth/login")
    .send({ email: "eve@example.com", password: "WrongPassword" })
    .expect(401);
  customer = (
    await api
      .post("/api/v1/auth/login")
      .send({ email: "eve@example.com", password: "Password123!" })
      .expect(200)
  ).body.data.token;
  await api
    .post("/api/v1/auth/register")
    .send({
      name: "Other",
      email: "other@example.com",
      password: "Password123!",
    })
    .expect(201);
  other = (
    await api
      .post("/api/v1/auth/login")
      .send({ email: "other@example.com", password: "Password123!" })
      .expect(200)
  ).body.data.token;
  await api.get("/api/v1/auth/me").expect(401);
  await authorize("get", "/auth/me", "invalid").expect(401);
  const expired = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: -1,
    issuer: "alive-api",
    audience: "alive-client",
  });
  await authorize("get", "/auth/me", expired).expect(401);
  await authorize("get", "/customers", customer).expect(403);
  await authorize("get", "/auth/me", customer).expect(200);
});
test("Media and customer complete CRUD, search and input errors", async () => {
  const body = {
    title: "Test Album",
    creator: "Test Artist",
    category: "music",
    format: "CD",
    total_copies: 1,
    daily_fee: 12.5,
    daily_late_fee: 3.25,
  };
  await authorize("post", "/media", customer).send(body).expect(403);
  await authorize("post", "/media", admin)
    .send({ ...body, daily_fee: -1 })
    .expect(400);
  await authorize("post", "/media", admin)
    .send({ ...body, total_copies: 1.5 })
    .expect(400);
  const media = await authorize("post", "/media", admin).send(body).expect(201);
  mediaId = media.body.data.id;
  await api.get("/api/v1/media/" + mediaId).expect(200);
  const search = await api
    .get("/api/v1/media?search=Test&category=music&format=CD")
    .expect(200);
  assert.equal(search.body.data.length, 1);
  await api.get("/api/v1/media?category=book").expect(400);
  await api.get("/api/v1/media/0").expect(400);
  await api.get("/api/v1/media/99999").expect(404);
  await authorize("patch", "/media/" + mediaId, admin)
    .send({ title: "Edited Album" })
    .expect(200);
  await authorize("patch", "/media/" + mediaId, admin)
    .send({})
    .expect(400);
  const temp = (
    await authorize("post", "/media", admin)
      .send({ ...body, title: "Disposable" })
      .expect(201)
  ).body.data.id;
  await authorize("delete", "/media/" + temp, admin).expect(200);
  await api.get("/api/v1/media/" + temp).expect(404);
  const u = (
    await authorize("post", "/customers", admin)
      .send({
        name: "Temporary",
        email: "temp@example.com",
        password: "Password123!",
      })
      .expect(201)
  ).body.data.id;
  await authorize("get", "/customers/" + u, admin).expect(200);
  await authorize("patch", "/customers/" + u, admin)
    .send({ name: "Updated" })
    .expect(200);
  await authorize("get", "/customers", admin).expect(200);
  await authorize("delete", "/customers/" + u, admin).expect(200);
  await authorize("get", "/customers/" + u, admin).expect(404);
});
test("Last-copy concurrency, request replay and ownership", async () => {
  const body = { media_id: mediaId, days: 3, request_key: randomUUID() };
  await authorize("post", "/rentals", admin).send(body).expect(403);
  await authorize("post", "/rentals", customer)
    .send({ ...body, days: 31 })
    .expect(400);
  const results = await Promise.all([
    authorize("post", "/rentals", customer).send(body),
    authorize("post", "/rentals", other).send({
      ...body,
      request_key: randomUUID(),
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const winner = results[0].status === 201 ? customer : other;
  const loser = winner === customer ? other : customer;
  const rental = results.find((r) => r.status === 201).body.data;
  rentalId = rental.id;
  const replay = await authorize("post", "/rentals", winner)
    .send({ media_id: mediaId, days: 3, request_key: rental.request_key })
    .expect(200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.data.id, rentalId);
  await authorize("post", "/rentals", winner)
    .send({ media_id: mediaId, days: 2, request_key: rental.request_key })
    .expect(409);
  await authorize("get", "/rentals/" + rentalId, loser).expect(403);
  assert.equal(
    (await authorize("get", "/rentals", loser).expect(200)).body.data.length,
    0,
  );
  assert.equal(
    (await api.get("/api/v1/media/" + mediaId).expect(200)).body.data
      .available_copies,
    0,
  );
  await authorize("delete", "/media/" + mediaId, admin).expect(409);
  await authorize("patch", "/media/" + mediaId, admin)
    .send({ archived: true })
    .expect(409);
  await authorize("delete", "/customers/" + rental.customer_id, admin).expect(
    409,
  );
  await authorize("patch", "/rentals/" + rentalId, winner)
    .send({ status: "returned" })
    .expect(403);
});
test("Overdue fee snapshots, return idempotence and history archive", async () => {
  await pool.execute("UPDATE rentals SET rented_on=?,due_on=? WHERE id=?", [
    addDays(today(), -5),
    addDays(today(), -2),
    rentalId,
  ]);
  await authorize("patch", "/media/" + mediaId, admin)
    .send({ daily_fee: 999, daily_late_fee: 999 })
    .expect(200);
  const estimate = (
    await authorize("get", "/rentals/" + rentalId, admin).expect(200)
  ).body.data;
  assert.equal(estimate.status, "overdue");
  assert.equal(estimate.estimated_late_fee, 6.5);
  const [a, b] = await Promise.all([
    authorize("patch", "/rentals/" + rentalId, admin).send({
      status: "returned",
    }),
    authorize("patch", "/rentals/" + rentalId, admin).send({
      status: "returned",
    }),
  ]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal(a.body.data.total, 44);
  assert.equal(b.body.data.total, 44);
  assert.equal(a.body.data.daily_late_fee, 3.25);
  assert.equal(
    (await api.get("/api/v1/media/" + mediaId).expect(200)).body.data
      .available_copies,
    1,
  );
  await authorize("delete", "/media/" + mediaId, admin).expect(200);
  await api.get("/api/v1/media/" + mediaId).expect(404);
  await authorize("get", "/media/" + mediaId, admin).expect(200);
  const owner = a.body.data.customer_id;
  await authorize("delete", "/customers/" + owner, admin).expect(200);
  const ownerToken = owner === userId ? customer : other;
  await authorize("get", "/auth/me", ownerToken).expect(401);
  await authorize("get", "/rentals/" + rentalId, admin).expect(200);
});
test("Same-key concurrent requests create exactly one rental, on-time return", async () => {
  const media = (
    await authorize("post", "/media", admin)
      .send({
        title: "Retry Album",
        creator: "Artist",
        category: "music",
        format: "DVD",
        total_copies: 2,
        daily_fee: 0.1,
        daily_late_fee: 0.1,
      })
      .expect(201)
  ).body.data;
  const user = (
    await authorize("post", "/customers", admin)
      .send({
        name: "Retry",
        email: "retry@example.com",
        password: "Password123!",
      })
      .expect(201)
  ).body.data;
  const token = (
    await api
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "Password123!" })
      .expect(200)
  ).body.data.token;
  const body = { media_id: media.id, days: 3, request_key: randomUUID() };
  const results = await Promise.all([
    authorize("post", "/rentals", token).send(body),
    authorize("post", "/rentals", token).send(body),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.equal(results[0].body.data.id, results[1].body.data.id);
  assert.equal(
    (await authorize("get", "/rentals", token).expect(200)).body.data.length,
    1,
  );
  await pool.execute("UPDATE rentals SET due_on=? WHERE id=?", [
    today(),
    results[0].body.data.id,
  ]);
  const returned = await authorize(
    "patch",
    "/rentals/" + results[0].body.data.id,
    admin,
  )
    .send({ status: "returned" })
    .expect(200);
  assert.equal(returned.body.data.late_fee, 0);
  assert.equal(returned.body.data.total, 0.3);
});

test("Server rejects weak new passwords in registration and customer create/update", async () => {
  const weak = {
    name: "Weak Password Test",
    email: "weak@example.com",
    password: "password123!",
  };
  await api.post("/api/v1/auth/register").send(weak).expect(400);
  await authorize("post", "/customers", admin).send(weak).expect(400);
  await authorize("patch", "/customers/" + userId, admin)
    .send({ password: "Password123" })
    .expect(400);
});
