import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { userApi, errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, ErrorState, EmptyState, Modal, Field, useLoad, useToast, useConfirm } from '../components/ui.jsx';

const EMPTY = { username: '', full_name: '', role: 'Attendant', password: '', is_active: true };
const ROLE_HELP = {
  Admin: 'Everything, including users, tests, fees and settings',
  Attendant: 'Patients, test assignment, sample status, printing',
  Assistant: 'Sample status, result entry, printing',
};

function UserForm({ open, user, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setErrors({}); setF(user ? { ...user, password: '', is_active: !!user.is_active } : EMPTY); } }, [open, user]);
  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[A-Za-z0-9._-]+$/.test(f.username)) errs.username = 'Letters, digits, dot, dash, underscore';
    if (!f.full_name.trim()) errs.full_name = 'Full name is required';
    if (!user && f.password.length < 6) errs.password = 'At least 6 characters';
    if (user && f.password && f.password.length < 6) errs.password = 'At least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (user) await userApi.update(user.user_id, f); else await userApi.create(f);
      toast(user ? 'User updated' : 'User created');
      onSaved();
    } catch (ex) { toast(errMsg(ex), 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit user' : 'New user'}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" form="user-form" disabled={saving}>{saving ? 'Saving…' : 'Save user'}</button></>}>
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <Field label="Username" htmlFor="uf-u" required error={errors.username}><input id="uf-u" className="input" autoComplete="off" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} maxLength={50} /></Field>
        <Field label="Full name" htmlFor="uf-n" required error={errors.full_name}><input id="uf-n" className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={100} /></Field>
        <Field label="Role" htmlFor="uf-r" required className="sm:col-span-2">
          <select id="uf-r" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {Object.keys(ROLE_HELP).map((r) => <option key={r}>{r}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink-500">{ROLE_HELP[f.role]}</p>
        </Field>
        <Field label={user ? 'New password (leave blank to keep)' : 'Password'} htmlFor="uf-p" required={!user} error={errors.password}>
          <input id="uf-p" type="password" className="input" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useLoad(() => userApi.list());
  const [form, setForm] = useState({ open: false, user: null });
  const remove = async (u) => {
    if (!(await confirm({ message: `Delete user ${u.username}? They will no longer be able to sign in.` }))) return;
    try { await userApi.remove(u.user_id); toast('User deleted'); reload(); } catch (e) { toast(errMsg(e), 'error'); }
  };
  return (
    <div>
      <PageHeader title="Users" subtitle="Admin, Attendant and Assistant accounts"
        actions={<button className="btn-primary" onClick={() => setForm({ open: true, user: null })}><Plus size={16} /> New user</button>} />
      <div className="card-flush overflow-x-auto">
        {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.length ? <EmptyState /> : (
          <table className="table">
            <thead><tr><th>Username</th><th>Full name</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.user_id}>
                  <td className="font-medium">{u.username}</td>
                  <td>{u.full_name}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? <span className="text-emerald-700">Active</span> : <span className="text-ink-400">Inactive</span>}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="btn-icon" onClick={() => setForm({ open: true, user: u })} aria-label={`Edit ${u.username}`}><Pencil size={16} /></button>
                    {u.user_id !== me.userId && <button className="btn-icon hover:text-red-600" onClick={() => remove(u)} aria-label={`Delete ${u.username}`}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <UserForm open={form.open} user={form.user} onClose={() => setForm({ open: false, user: null })} onSaved={() => { setForm({ open: false, user: null }); reload(); }} />
    </div>
  );
}
