import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { createCustomer, findUser } from '../models/users.js';
import * as v from '../utils/validation.js';
import { fail } from '../utils/errors.js';
export async function register(req,res) {
  v.object(req.body,['name','email','password']);
  const user = await createCustomer({ name:v.text(req.body.name,'name',100), email:v.email(req.body.email), password:v.password(req.body.password) });
  res.status(201).json({ data:user });
}
export async function login(req,res) {
  v.object(req.body,['email','password']);
  const email = v.email(req.body.email), password = v.password(req.body.password);
  const [[user]] = await pool.execute('SELECT * FROM users WHERE email=?', [email]);
  if (!user || !await bcrypt.compare(password,user.password_hash) || !user.active) fail(401, 'Email or password is incorrect');
  const token = jwt.sign({},env.jwtSecret,{ algorithm:'HS256',subject:String(user.id),expiresIn:env.jwtExpires,issuer:'alive-api',audience:'alive-client' });
  res.json({ data:{ token,user:await findUser(user.id) } });
}
export function me(req,res) { res.json({ data:req.user }); }
