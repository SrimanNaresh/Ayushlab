import { verifyToken } from '../utils/jwt.js';
import { getPool, sql } from '../db/pool.js';

// Every protected request re-reads the user, so a deactivated user or a role
// change takes effect immediately rather than when the token expires.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Session expired, please sign in again' });
  }
  try {
    const pool = await getPool();
    const r = await pool.request().input('id', sql.Int, payload.userId)
      .query('SELECT user_id, username, full_name, role, is_active FROM app_users WHERE user_id = @id');
    const u = r.recordset[0];
    if (!u || !u.is_active) return res.status(401).json({ error: 'Your account is not active' });
    req.user = { userId: u.user_id, username: u.username, fullName: u.full_name, role: u.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Only ${roles.join(' / ')} users can do this` });
    }
    next();
  };
}
