import { Router } from 'express';
import { getPool, sql } from '../db/pool.js';
import { requireRole } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { h, bad, notFound, str } from '../utils/helpers.js';

const router = Router();
router.use(requireRole('Admin'));

const ROLES = ['Admin', 'Attendant', 'Assistant'];

function parse(body, isNew) {
  const username = str(body.username, 50, 'Username', { required: true });
  if (!/^[A-Za-z0-9._-]+$/.test(username)) throw bad('Username may contain letters, digits, dot, dash and underscore only');
  const full_name = str(body.full_name, 100, 'Full name', { required: true });
  if (!ROLES.includes(body.role)) throw bad('Role must be Admin, Attendant or Assistant');
  const password = body.password ? String(body.password) : '';
  if (isNew && password.length < 6) throw bad('Password must be at least 6 characters');
  if (!isNew && password && password.length < 6) throw bad('Password must be at least 6 characters');
  return { username, full_name, role: body.role, is_active: body.is_active === false ? 0 : 1, password };
}

router.get('/', h(async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT user_id, username, full_name, role, is_active, created_at FROM app_users ORDER BY username');
  res.json(r.recordset);
}));

router.post('/', h(async (req, res) => {
  const d = parse(req.body || {}, true);
  const pool = await getPool();
  const r = await pool.request()
    .input('u', sql.NVarChar, d.username).input('f', sql.NVarChar, d.full_name)
    .input('r', sql.NVarChar, d.role).input('a', sql.Bit, d.is_active)
    .input('p', sql.NVarChar, hashPassword(d.password))
    .query('INSERT INTO app_users (username, full_name, role, is_active, password_hash) OUTPUT INSERTED.user_id VALUES (@u,@f,@r,@a,@p)');
  res.status(201).json({ user_id: r.recordset[0].user_id });
}));

async function adminsLeftWithout(pool, id) {
  const r = await pool.request().input('id', sql.Int, id)
    .query("SELECT COUNT(*) AS n FROM app_users WHERE role = 'Admin' AND is_active = 1 AND user_id <> @id");
  return r.recordset[0].n;
}

router.put('/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  const d = parse(req.body || {}, false);
  const pool = await getPool();
  if ((d.role !== 'Admin' || !d.is_active) && (await adminsLeftWithout(pool, id)) === 0) {
    throw bad('At least one active Admin is required');
  }
  const q = pool.request().input('id', sql.Int, id)
    .input('u', sql.NVarChar, d.username).input('f', sql.NVarChar, d.full_name)
    .input('r', sql.NVarChar, d.role).input('a', sql.Bit, d.is_active);
  let set = 'username=@u, full_name=@f, role=@r, is_active=@a, updated_at=SYSDATETIME()';
  if (d.password) { q.input('p', sql.NVarChar, hashPassword(d.password)); set += ', password_hash=@p'; }
  const r = await q.query(`UPDATE app_users SET ${set} WHERE user_id=@id`);
  if (!r.rowsAffected[0]) throw notFound('User');
  res.json({ ok: true });
}));

router.delete('/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.userId) throw bad('You cannot delete your own account');
  const pool = await getPool();
  if ((await adminsLeftWithout(pool, id)) === 0) throw bad('At least one active Admin is required');
  const r = await pool.request().input('id', sql.Int, id).query('DELETE FROM app_users WHERE user_id=@id');
  if (!r.rowsAffected[0]) throw notFound('User');
  res.json({ ok: true });
}));

export default router;
