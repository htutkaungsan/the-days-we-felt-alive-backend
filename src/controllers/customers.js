import * as model from "../models/users.js";
import * as v from "../utils/validation.js";
import { fail } from "../utils/errors.js";
function validate(body, partial = false) {
  v.object(
    body,
    partial
      ? ["name", "email", "password", "active"]
      : ["name", "email", "password"],
  );
  const data = {};
  if (!partial || body.name !== undefined)
    data.name = v.text(body.name, "name", 100);
  if (!partial || body.email !== undefined) data.email = v.email(body.email);
  if (!partial || body.password !== undefined)
    data.password = v.password(body.password);
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") fail(400, "active must be boolean");
    data.active = body.active;
  }
  if (!Object.keys(data).length) fail(400, "Provide at least one field");
  return data;
}
export async function list(req, res) {
  res.json({ data: await model.listCustomers() });
}
export async function get(req, res) {
  res.json({ data: await model.getCustomer(v.id(req.params.id)) });
}
export async function create(req, res) {
  res
    .status(201)
    .json({ data: await model.createCustomer(validate(req.body)) });
}
export async function update(req, res) {
  res.json({
    data: await model.updateCustomer(
      v.id(req.params.id),
      validate(req.body, true),
    ),
  });
}
export async function remove(req, res) {
  res.json({
    data: { message: await model.deleteCustomer(v.id(req.params.id)) },
  });
}
