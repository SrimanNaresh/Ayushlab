import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { resultApi, errMsg } from '../api/client.js';
import { Spinner, ErrorState } from '../components/ui.jsx';
import { fmtDate } from '../utils/format.js';

// Printable laboratory report. The server returns only tests/components that
// have an entered result, and only for completed results.
export default function Report() {
  const { assignmentId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    resultApi.report(assignmentId).then((d) => { setData(d); document.title = `Report ${d.assignment.assignment_no} - ${d.assignment.full_name}`; })
      .catch((e) => setErr(errMsg(e)));
  }, [assignmentId]);

  if (err) return <div className="p-6"><ErrorState message={err} /><p className="text-center"><Link className="text-sm font-semibold text-brand-700 underline" to="/results">Back to Result Entry</Link></p></div>;
  if (!data) return <Spinner label="Preparing report…" />;
  const { lab, assignment: a, tests } = data;
  const range = (c) => {
    if (a.gender === 'Male' && c.male_range) return c.male_range;
    if (a.gender === 'Female' && c.female_range) return c.female_range;
    return c.general_range || c.male_range || c.female_range || '';
  };

  return (
    <div className="min-h-screen bg-ink-100 py-4 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-3 flex max-w-[210mm] justify-between gap-2 px-3">
        <Link to="/results" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
        <button className="btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
      </div>
      <article className="mx-auto max-w-[210mm] bg-white p-6 text-[13px] text-black shadow print:max-w-none print:p-0 print:shadow-none sm:p-10">
        <div className="flex flex-col gap-1 border-b-2 border-brand-700 pb-3 text-center">
          <h1 className="text-2xl font-bold text-brand-800">{lab.lab_name}</h1>
          {lab.address && <p className="whitespace-pre-line text-xs">{lab.address}</p>}
          {(lab.phone || lab.email) && <p className="text-xs">{[lab.phone && `Ph: ${lab.phone}`, lab.email].filter(Boolean).join(' · ')}</p>}
          <p className="mt-1 text-sm font-bold uppercase tracking-widest">Laboratory Report</p>
        </div>

        <section className="grid grid-cols-2 gap-x-6 gap-y-1 border-b border-ink-300 py-3 text-[12.5px]">
          <p><b>Patient:</b> {a.full_name}</p>
          <p><b>Patient ID:</b> {a.patient_code}</p>
          <p><b>Age / Gender:</b> {a.age !== null ? `${a.age} Y` : '—'} / {a.gender}</p>
          <p><b>Report No:</b> {a.assignment_no}</p>
          <p><b>Referred by:</b> {a.referred_by || '—'}</p>
          <p><b>Sample date:</b> {fmtDate(a.assignment_date)}</p>
          <p><b>Phone:</b> {a.phone || '—'}</p>
          <p><b>Reported on:</b> {a.completed_at ? fmtDate(a.completed_at) : ''}</p>
        </section>

        {tests.map((t) => (
          <section key={t.assignment_test_id} className="mt-4 break-inside-avoid">
            <h2 className="mb-1 bg-brand-50 px-2 py-1 text-[13px] font-bold uppercase text-brand-900 print:bg-transparent print:px-0">{t.test_name}</h2>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-ink-400 text-left">
                  <th className="py-1 pr-2 font-semibold">Component</th>
                  <th className="py-1 pr-2 font-semibold">Result</th>
                  <th className="py-1 pr-2 font-semibold">Reference range</th>
                </tr>
              </thead>
              <tbody>
                {t.components.map((c, i) => (
                  <tr key={i} className="border-b border-ink-100">
                    <td className="py-1 pr-2">{c.component_name}</td>
                    <td className="py-1 pr-2 font-bold">{c.result_value}</td>
                    <td className="py-1 pr-2">{range(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        <div className="mt-10 flex items-end justify-between border-t border-ink-300 pt-3 text-[11px] text-ink-700">
          <p>{lab.report_footer}</p>
          <p className="text-right"><span className="mb-6 block" />Authorised signatory</p>
        </div>
      </article>
    </div>
  );
}
