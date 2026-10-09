import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUser } from '../models/users.js';
import { fail } from '../utils/errors.js';
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) fail(401, 'A Bearer token is required');
  let payload;
  try { payload = jwt.verify(header.slice(7), env.jwtSecret, { algorithms:['HS256'], issuer:'alive-api', audience:'alive-client' }); }
  catch { fail(401, 'Invalid or expired token'); }
  req.user = await findUser(Number(payload.sub));
  if (!req.user || !req.user.active) fail(401, 'Account is unavailable');
  next();
}
export async function optionalAuth(req, res, next) {
  if (req.headers.authorization) return authenticate(req,res,next);
  next();
}
export function role(required) {
  return (req,res,next) => { if (req.user.role !== required) fail(403, 'This action is not permitted for your role'); next(); };
}
