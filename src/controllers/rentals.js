import * as model from "../models/rentals.js";
import * as v from "../utils/validation.js";
export async function list(req, res) {
  res.json({ data: await model.listRentals(req.user) });
}
export async function get(req, res) {
  res.json({ data: await model.getRental(v.id(req.params.id), req.user) });
}
export async function create(req, res) {
  v.object(req.body, ["media_id", "days", "request_key"]);
  const data = {
    media_id: v.integer(req.body.media_id, "media_id", 1, 4294967295),
    days: v.integer(req.body.days, "days", 1, 30),
    request_key: v.uuid(req.body.request_key),
  };
  const result = await model.createRental(req.user.id, data);
  res
    .status(result.replayed ? 200 : 201)
    .json({ data: result.rental, replayed: result.replayed });
}
export async function update(req, res) {
  v.object(req.body, ["status"]);
  v.choice(req.body.status, "status", ["returned"]);
  res.json({ data: await model.returnRental(v.id(req.params.id), req.user) });
}
