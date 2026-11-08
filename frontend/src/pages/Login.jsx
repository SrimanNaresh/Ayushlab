import { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, Users, FlaskConical, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/client.js';
import { InstallLink } from '../components/InstallApp.jsx';

// Sign-in: deep navy → teal backdrop with soft blurred circles; on wide screens
// the lab's name and what the app does on the left, a frosted sign-in card on
// the right. On phones the two stack.
export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Enter your username and password');
    setBusy(true);
    setError('');
    try {
      await login(username.trim(), password);
      window.history.replaceState(null, '', '/');
    } catch (ex) {
      setError(errMsg(ex));
      setBusy(false);
    }
  };

  const features = [
    [Users, 'Patients & test assignment', 'Register patients and assign tests with fees'],
    [FlaskConical, 'Test master & ranges', 'Male, female and general reference ranges'],
    [FileText, 'Results & reports', 'Enter results and print clean lab reports'],
  ];

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-sidebar-gradient px-4 py-8">
      <span className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-sm" />
      <span className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-teal-400/15 blur-2xl" />
      <span className="pointer-events-none absolute right-1/3 top-10 h-40 w-40 rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative grid w-full max-w-4xl items-center gap-8 lg:grid-cols-2">
        <div className="text-white">
          <div className="flex items-center gap-3 lg:block">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg lg:h-14 lg:w-14">
              <img src="/favicon.svg" alt="" className="h-full w-full object-contain" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight lg:mt-5 lg:text-4xl">Ayush Lab</h1>
              <p className="mt-1 max-w-sm text-sm text-white/70">Laboratory management — patients, tests, results and reports in one place.</p>
            </div>
          </div>
          <ul className="mt-7 hidden space-y-3.5 sm:block">
            {features.map(([Icon, title, text]) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><Icon size={18} /></span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-12 text-white/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-sm animate-fade-in rounded-2xl border border-white/20 bg-white/10 p-7 text-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-13 text-white/70">Sign in to continue</p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/80" htmlFor="login-user">Username</label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="login-user" className="input min-h-[38px] pl-9" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus placeholder="Username" autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/80" htmlFor="login-pass">Password</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="login-pass" type={show ? 'text' : 'password'} className="input min-h-[38px] pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-13 font-medium text-red-700" role="alert">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <LogIn size={16} />}
              {busy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-5 flex justify-center"><InstallLink /></div>
          <p className="mt-4 text-center text-11 text-white/50">© {new Date().getFullYear()} Ayush Lab</p>
        </div>
      </div>
    </div>
  );
}
