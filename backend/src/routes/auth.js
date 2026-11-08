import { Router } from 'express';
import { getPool, sql } from '../db/pool.js';
import { verifyPassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { h, bad } from '../utils/helpers.js';

const router = Router();

// Simple in-memory throttle: 10 failed attempts per username+IP per 15 minutes.
const failures = new Map();
const WINDOW = 15 * 60 * 1000;

router.post('/login', h(async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) throw bad('Username and password are required');
  const key = `${username.toLowerCase()}|${req.ip}`;
  const f = failures.get(key);
  if (f && f.count >= 10 && Date.now() - f.first < WINDOW) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in a few minutes.' });
  }
  const pool = await getPool();
  const r = await pool.request().input('u', sql.NVarChar, username)
    .query('SELECT user_id, username, full_name, password_hash, role, is_active FROM app_users WHERE username = @u');
  const u = r.recordset[0];
  if (!u || !u.is_active || !verifyPassword(password, u.password_hash)) {
    const cur = f && Date.now() - f.first < WINDOW ? f : { count: 0, first: Date.now() };
    cur.count += 1;
    failures.set(key, cur);
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  failures.delete(key);
  const user = { userId: u.user_id, username: u.username, fullName: u.full_name, role: u.role };
  res.json({ token: signToken({ userId: u.user_id }), user });
}));

router.get('/me', requireAuth, (req, res) => res.json(req.user));

router.post('/change-password', requireAuth, h(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) throw bad('New password must be at least 6 characters');
  const pool = await getPool();
  const r = await pool.request().input('id', sql.Int, req.user.userId).query('SELECT password_hash FROM app_users WHERE user_id = @id');
  if (!verifyPassword(String(currentPassword || ''), r.recordset[0]?.password_hash)) throw bad('Current password is incorrect');
  await pool.request().input('id', sql.Int, req.user.userId).input('h', sql.NVarChar, hashPassword(newPassword))
    .query('UPDATE app_users SET password_hash = @h, updated_at = SYSDATETIME() WHERE user_id = @id');
  res.json({ ok: true });
}));

export default router;
