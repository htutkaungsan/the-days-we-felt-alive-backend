import * as model from '../models/media.js';
import * as v from '../utils/validation.js';
import { fail } from '../utils/errors.js';
function validate(body, partial=false) {
  v.object(body,partial ? ['title','creator','category','format','total_copies','daily_fee','daily_late_fee','archived'] : ['title','creator','category','format','total_copies','daily_fee','daily_late_fee']);
  const data={};
  for (const k of ['title','creator']) if (!partial || body[k] !== undefined) data[k]=v.text(body[k],k);
  if (!partial || body.category !== undefined) data.category=v.choice(body.category,'category',['music','movie']);
  if (!partial || body.format !== undefined) data.format=v.choice(body.format,'format',['CD','DVD']);
  if (!partial || body.total_copies !== undefined) data.total_copies=v.integer(body.total_copies,'total_copies',1,999);
  for (const k of ['daily_fee','daily_late_fee']) if (!partial || body[k] !== undefined) data[k]=v.money(body[k],k);
  if (body.archived !== undefined) { if (typeof body.archived !== 'boolean') fail(400,'archived must be boolean'); data.archived=body.archived; }
  if (!Object.keys(data).length) fail(400,'Provide at least one field');
  return data;
}
export async function list(req,res) {
  const q={};
  if (req.query.search !== undefined) { if (typeof req.query.search !== 'string' || req.query.search.length > 150) fail(400,'Invalid search'); q.search=req.query.search.trim(); }
  if (req.query.category !== undefined) q.category=v.choice(req.query.category,'category',['music','movie']);
  if (req.query.format !== undefined) q.format=v.choice(req.query.format,'format',['CD','DVD']);
  res.json({ data:await model.listMedia(q,req.user?.role==='admin') });
}
export async function get(req,res) { res.json({ data:await model.getMedia(v.id(req.params.id),req.user?.role==='admin') }); }
export async function create(req,res) { res.status(201).json({ data:await model.createMedia(validate(req.body)) }); }
export async function update(req,res) { res.json({ data:await model.updateMedia(v.id(req.params.id),validate(req.body,true)) }); }
export async function remove(req,res) { res.json({ data:{ message:await model.deleteMedia(v.id(req.params.id)) } }); }
