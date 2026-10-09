import * as model from "../models/media.js";
import * as v from "../utils/validation.js";
import { fail } from "../utils/errors.js";
function validate(body, partial = false) {
  v.object(
    body,
    partial
      ? [
          "title",
          "creator",
          "category",
          "format",
          "total_copies",
          "daily_fee",
          "daily_late_fee",
          "original_title",
          "release_year",
          "language",
          "genre",
          "description",
          "featured_tracks",
          "image_url",
          "archived",
        ]
      : [
          "title",
          "creator",
          "category",
          "format",
          "total_copies",
          "daily_fee",
          "daily_late_fee",
          "original_title",
          "release_year",
          "language",
          "genre",
          "description",
          "featured_tracks",
          "image_url",
        ],
  );
  const data = {};
  for (const k of ["title", "creator"])
    if (!partial || body[k] !== undefined) data[k] = v.text(body[k], k);
  if (!partial || body.category !== undefined)
    data.category = v.choice(body.category, "category", ["music", "movie"]);
  if (!partial || body.format !== undefined)
    data.format = v.choice(body.format, "format", ["CD", "DVD"]);
  if (!partial || body.total_copies !== undefined)
    data.total_copies = v.integer(body.total_copies, "total_copies", 1, 999);
  for (const k of ["daily_fee", "daily_late_fee"])
    if (!partial || body[k] !== undefined) data[k] = v.money(body[k], k);
  for (const [key, max] of [
    ["original_title", 150],
    ["genre", 100],
    ["description", 1000],
    ["featured_tracks", 500],
  ]) {
    if (body[key] !== undefined)
      data[key] =
        body[key] === null || body[key] === ""
          ? null
          : v.text(body[key], key, max);
  }
  if (body.release_year !== undefined)
    data.release_year =
      body.release_year === null
        ? null
        : v.integer(body.release_year, "release_year", 1990, 2014);
  if (body.language !== undefined)
    data.language =
      body.language === null || body.language === ""
        ? null
        : v.choice(body.language, "language", ["Thai", "English"]);
  if (body.image_url !== undefined) {
    if (body.image_url === null || body.image_url === "") data.image_url = null;
    else {
      const url = v.text(body.image_url, "image_url", 255);
      if (!/^\/images\/retro\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(url))
        fail(400, "image_url must be a local /images/retro/ image path");
      data.image_url = url;
    }
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean")
      fail(400, "archived must be boolean");
    data.archived = body.archived;
  }
  if (!Object.keys(data).length) fail(400, "Provide at least one field");
  return data;
}
export async function list(req, res) {
  const q = {};
  if (req.query.search !== undefined) {
    if (typeof req.query.search !== "string" || req.query.search.length > 150)
      fail(400, "Invalid search");
    q.search = req.query.search.trim();
  }
  if (req.query.category !== undefined)
    q.category = v.choice(req.query.category, "category", ["music", "movie"]);
  if (req.query.format !== undefined)
    q.format = v.choice(req.query.format, "format", ["CD", "DVD"]);
  res.json({ data: await model.listMedia(q, req.user?.role === "admin") });
}
export async function get(req, res) {
  res.json({
    data: await model.getMedia(v.id(req.params.id), req.user?.role === "admin"),
  });
}
export async function create(req, res) {
  res.status(201).json({ data: await model.createMedia(validate(req.body)) });
}
export async function update(req, res) {
  res.json({
    data: await model.updateMedia(
      v.id(req.params.id),
      validate(req.body, true),
    ),
  });
}
export async function remove(req, res) {
  res.json({ data: { message: await model.deleteMedia(v.id(req.params.id)) } });
}
