import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { patientApi, errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Spinner, ErrorState, EmptyState, Modal, Field, useLoad, useToast, useConfirm, useDebounced } from '../components/ui.jsx';
import SheetTools, { IssueTable } from '../components/SheetTools.jsx';
import { downloadXlsx, downloadCsv, readSheet, normDate } from '../utils/sheet.js';
import { fmtDate, ymd, todayStr, ageFrom } from '../utils/format.js';

const COLS = [
  { header: 'Patient ID', key: 'patient_code', width: 14, text: true, aliases: ['patientid', 'id'] },
  { header: 'Full Name', key: 'full_name', width: 26, required: true, aliases: ['name', 'patientname'] },
  { header: 'Gender', key: 'gender', width: 10, required: true, aliases: ['sex'] },
  { header: 'Date of Birth', key: 'date_of_birth', width: 14, text: true, aliases: ['dob'] },
  { header: 'Age', key: 'age', width: 8 },
  { header: 'Phone', key: 'phone', width: 16, text: true, aliases: ['mobile', 'phoneno'] },
  { header: 'Email', key: 'email', width: 24 },
  { header: 'Address', key: 'address', width: 32 },
  { header: 'Referred By', key: 'referred_by', width: 20, aliases: ['referredby', 'doctor'] },
  { header: 'Registration Date', key: 'registration_date', width: 16, text: true, aliases: ['regdate'] },
];

const EMPTY = { patient_code: '', full_name: '', gender: '', date_of_birth: '', age: '', phone: '', email: '', address: '', referred_by: '', registration_date: '' };

function validate(f) {
  const e = {};
  if (!f.full_name.trim()) e.full_name = 'Full name is required';
  if (!f.gender) e.gender = 'Select a gender';
  if (f.date_of_birth && f.date_of_birth > todayStr()) e.date_of_birth = 'Date of birth cannot be in the future';
  if (f.date_of_birth && f.registration_date && f.date_of_birth > f.registration_date) e.date_of_birth = 'Must be on or before the registration date';
  if (!f.date_of_birth && f.age !== '' && !(Number.isInteger(Number(f.age)) && Number(f.age) >= 0 && Number(f.age) <= 150)) e.age = 'Age must be 0–150';
  if (f.phone && !/^[0-9+()\-\s]{5,20}$/.test(f.phone)) e.phone = 'Use digits, spaces, +, - only (5–20)';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  return e;
}

export function PatientForm({ open, patient, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(patient ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, k.includes('date') ? ymd(patient[k]) : (patient[k] ?? '')])) : { ...EMPTY, registration_date: todayStr() });
  }, [open, patient]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const age = f.date_of_birth ? ageFrom(f.date_of_birth) : f.age;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f);
    if (patient && !f.patient_code.trim()) errs.patient_code = 'Patient ID is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const body = { ...f, age: f.date_of_birth ? '' : f.age };
      if (patient) { await patientApi.update(patient.patient_id, body); toast('Patient updated'); onSaved(patient); }
      else { const r = await patientApi.create(body); toast(`Patient ${r.patient_code} registered`); onSaved(r); }
    } catch (ex) { toast(errMsg(ex), 'error'); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={patient ? `Edit patient ${patient.patient_code}` : 'Register patient'} size="lg"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" form="patient-form" disabled={saving}>{saving ? 'Saving…' : 'Save patient'}</button></>}>
      <form id="patient-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Patient ID" htmlFor="pf-code" error={errors.patient_code}>
          <input id="pf-code" className="input" value={f.patient_code} onChange={set('patient_code')} placeholder={patient ? '' : 'Leave blank to generate'} maxLength={20} />
        </Field>
        <Field label="Registration date" htmlFor="pf-reg"><input id="pf-reg" type="date" className="input" value={f.registration_date} onChange={set('registration_date')} max={todayStr()} /></Field>
        <Field label="Full name" htmlFor="pf-name" required error={errors.full_name} className="sm:col-span-2">
          <input id="pf-name" className="input" value={f.full_name} onChange={set('full_name')} maxLength={150} />
        </Field>
        <Field label="Gender" htmlFor="pf-gender" required error={errors.gender}>
          <select id="pf-gender" className="input" value={f.gender} onChange={set('gender')}>
            <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth" htmlFor="pf-dob" error={errors.date_of_birth}><input id="pf-dob" type="date" className="input" value={f.date_of_birth} onChange={set('date_of_birth')} max={todayStr()} /></Field>
          <Field label="Age (years)" htmlFor="pf-age" error={errors.age}>
            <input id="pf-age" type="number" min="0" max="150" className="input" value={age} onChange={set('age')} disabled={!!f.date_of_birth} title={f.date_of_birth ? 'Calculated from date of birth' : ''} />
          </Field>
        </div>
        <Field label="Phone" htmlFor="pf-phone" error={errors.phone}><input id="pf-phone" type="tel" className="input" value={f.phone} onChange={set('phone')} maxLength={20} /></Field>
        <Field label="Email" htmlFor="pf-email" error={errors.email}><input id="pf-email" type="email" className="input" value={f.email} onChange={set('email')} maxLength={150} /></Field>
        <Field label="Referred by" htmlFor="pf-ref" className="sm:col-span-2"><input id="pf-ref" className="input" value={f.referred_by} onChange={set('referred_by')} maxLength={150} /></Field>
        <Field label="Address" htmlFor="pf-addr" className="sm:col-span-2"><textarea id="pf-addr" rows={2} className="input" value={f.address} onChange={set('address')} maxLength={400} /></Field>
      </form>
    </Modal>
  );
}

export default function Patients() {
  const { can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useLoad(() => patientApi.list(q), [q]);
  const [form, setForm] = useState({ open: false, patient: null });

  useEffect(() => {
    if (params.get('new') && can('editPatients')) { setForm({ open: true, patient: null }); setParams({}, { replace: true }); }
  }, [params, setParams, can]);

  const remove = async (p) => {
    if (!(await confirm({ message: `Delete patient ${p.full_name} (${p.patient_code})? This cannot be undone.` }))) return;
    try { await patientApi.remove(p.patient_id); toast('Patient deleted'); reload(); } catch (e) { toast(errMsg(e), 'error'); }
  };

  const template = () => downloadXlsx('patients-template.xlsx', 'Patients', COLS, [
    { patient_code: '', full_name: 'Sample Patient', gender: 'Female', date_of_birth: '1990-05-21', age: '', phone: '9876543210', email: 'sample@example.com', address: 'Chennai', referred_by: 'Dr. Kumar', registration_date: todayStr() },
  ], [
    'Patients import',
    'Full Name and Gender (Male / Female / Other) are required.',
    'Patient ID: leave blank to generate one (P000001 ...).',
    'Dates: YYYY-MM-DD or DD-MM-YYYY. Age is calculated from Date of Birth when it is given.',
    'A row is skipped as a duplicate when its Patient ID exists, or the same Full Name + Date of Birth exists.',
    'Delete the sample row before importing.',
  ]);
  const exportRows = async (kind) => {
    const rows = (await patientApi.exportRows()).map((p) => ({ ...p, date_of_birth: ymd(p.date_of_birth), registration_date: ymd(p.registration_date) }));
    if (!rows.length) throw new Error('There are no patients to export');
    if (kind === 'csv') downloadCsv('patients.csv', COLS, rows);
    else await downloadXlsx('patients.xlsx', 'Patients', COLS, rows);
  };
  const importFile = async (file) => {
    const rows = (await readSheet(file, COLS)).map((r) => ({ ...r, date_of_birth: normDate(r.date_of_birth), registration_date: normDate(r.registration_date) }));
    const res = await patientApi.importRows(rows);
    reload();
    return { ...res, total: rows.length };
  };

  const list = data || [];
  return (
    <div>
      <PageHeader title="Patients" subtitle="Search by Patient ID, name, phone or email"
        actions={<>
          <SheetTools canImport={can('editPatients')} onTemplate={template} onExport={exportRows} onImport={importFile}
            renderResult={(r) => (
              <div>
                <p className="text-sm">Read <b>{r.total}</b> row(s): <b className="text-emerald-700">{r.created} added</b>, {r.duplicates.length} duplicate(s) skipped, {r.invalid.length} invalid.</p>
                <IssueTable title="Duplicates skipped" rows={r.duplicates} tone="amber" />
                <IssueTable title="Invalid rows" rows={r.invalid} />
              </div>
            )} />
          {can('editPatients') && <button className="btn-primary" onClick={() => setForm({ open: true, patient: null })}><Plus size={16} /> New patient</button>}
        </>} />
      <div className="card-flush">
        <div className="border-b border-ink-100 p-3">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Search patients…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search patients" />
          </div>
        </div>
        {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : !list.length ? (
          <EmptyState message={q ? 'No patients match your search.' : 'No patients registered yet.'} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead><tr><th>Patient ID</th><th>Name</th><th>Gender</th><th>Age</th><th>Phone</th><th>Email</th><th>Referred by</th><th>Registered</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.patient_id}>
                      <td className="font-mono text-xs font-semibold">{p.patient_code}</td>
                      <td className="font-medium text-ink-900">{p.full_name}</td>
                      <td>{p.gender}</td>
                      <td>{p.age ?? ''}</td>
                      <td>{p.phone}</td>
                      <td className="max-w-[180px] truncate">{p.email}</td>
                      <td>{p.referred_by}</td>
                      <td className="whitespace-nowrap">{fmtDate(p.registration_date)}</td>
                      <td className="whitespace-nowrap text-right">
                        {can('editAssignments') && <Link className="btn-icon" to={`/assignments/new?patient=${p.patient_id}`} title="Assign tests" aria-label={`Assign tests to ${p.full_name}`}><ClipboardList size={16} /></Link>}
                        {can('editPatients') && <button className="btn-icon" onClick={() => setForm({ open: true, patient: p })} aria-label={`Edit ${p.full_name}`}><Pencil size={16} /></button>}
                        {can('deletePatients') && <button className="btn-icon hover:text-red-600" onClick={() => remove(p)} aria-label={`Delete ${p.full_name}`}><Trash2 size={16} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-ink-100 md:hidden">
              {list.map((p) => (
                <li key={p.patient_id} className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{p.full_name}</p>
                    <p className="text-xs text-ink-500">{p.patient_code} · {p.gender}{p.age !== null ? ` · ${p.age} y` : ''}</p>
                    <p className="text-xs text-ink-500">{[p.phone, p.email].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex shrink-0">
                    {can('editAssignments') && <Link className="btn-icon" to={`/assignments/new?patient=${p.patient_id}`} aria-label={`Assign tests to ${p.full_name}`}><ClipboardList size={17} /></Link>}
                    {can('editPatients') && <button className="btn-icon" onClick={() => setForm({ open: true, patient: p })} aria-label={`Edit ${p.full_name}`}><Pencil size={17} /></button>}
                    {can('deletePatients') && <button className="btn-icon" onClick={() => remove(p)} aria-label={`Delete ${p.full_name}`}><Trash2 size={17} /></button>}
                  </div>
                </li>
              ))}
            </ul>
            {list.length >= 500 && <p className="p-3 text-xs text-ink-500">Showing the latest 500 patients. Search to find others.</p>}
          </>
        )}
      </div>
      <PatientForm open={form.open} patient={form.patient} onClose={() => setForm({ open: false, patient: null })}
        onSaved={() => { setForm({ open: false, patient: null }); reload(); }} />
    </div>
  );
}
