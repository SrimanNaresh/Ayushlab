import { useState } from 'react';
import { Modal, Field, useToast } from './ui.jsx';
import { authApi, errMsg } from '../api/client.js';

export default function ChangePassword({ open, onClose }) {
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => { setF({ current: '', next: '', confirm: '' }); setErr(''); onClose(); };
  const submit = async (e) => {
    e.preventDefault();
    if (f.next.length < 6) return setErr('New password must be at least 6 characters');
    if (f.next !== f.confirm) return setErr('The new passwords do not match');
    setSaving(true);
    try {
      await authApi.changePassword(f.current, f.next);
      toast('Password changed');
      close();
    } catch (ex) { setErr(errMsg(ex)); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={close} title="Change password" size="sm"
      footer={<><button className="btn-secondary" onClick={close}>Cancel</button><button className="btn-primary" form="pwd-form" disabled={saving}>{saving ? 'Saving…' : 'Change password'}</button></>}>
      <form id="pwd-form" onSubmit={submit} className="space-y-3">
        <Field label="Current password" htmlFor="pw-cur"><input id="pw-cur" type="password" autoComplete="current-password" className="input" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
        <Field label="New password" htmlFor="pw-new"><input id="pw-new" type="password" autoComplete="new-password" className="input" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
        <Field label="Confirm new password" htmlFor="pw-con"><input id="pw-con" type="password" autoComplete="new-password" className="input" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        {err && <p className="field-error" role="alert">{err}</p>}
      </form>
    </Modal>
  );
}
