import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, KeyRound, Download } from 'lucide-react';
import TopNav, { SideNav, MobileMenu } from './TopNav.jsx';
import ChangePassword from './ChangePassword.jsx';
import { settingsApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useInstall } from '../utils/pwa.js';
import { IosInstallHelp } from './InstallApp.jsx';

function UserMenu({ onPassword }) {
  const { user, logout } = useAuth();
  const { canInstall, iosHint, install } = useInstall();
  const [iosHelp, setIosHelp] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = (user?.fullName || user?.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-ink-100" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-11 font-semibold text-white shadow-sm">{initials}</span>
        <span className="hidden text-13 font-semibold text-ink-700 sm:block">{user?.username || 'Account'}</span>
        <ChevronDown size={14} className="hidden text-ink-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-ink-100 bg-white py-1.5 shadow-elevated menu-drop">
          <div className="border-b border-ink-100 px-3.5 pb-2 pt-1">
            <p className="truncate text-13 font-semibold text-ink-800">{user?.fullName}</p>
            <p className="text-11 text-ink-400">{user?.role}</p>
          </div>
          <button role="menuitem" onClick={() => { setOpen(false); onPassword(); }} className="mt-1 flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50">
            <KeyRound size={15} /> Change password
          </button>
          {(canInstall || iosHint) && (
            <button role="menuitem" onClick={() => { setOpen(false); if (canInstall) install(); else setIosHelp(true); }} className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-brand-700 transition-colors hover:bg-brand-50">
              <Download size={15} /> Install app
            </button>
          )}
          <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50">
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
      <IosInstallHelp open={iosHelp} onClose={() => setIosHelp(false)} />
    </div>
  );
}

// App shell: sticky header + desktop menu (top bar, or a left column when the
// header's menu button is toggled — remembered in this browser), and the
// phone/tablet Menu button in the bottom-right corner.
export default function Layout() {
  const [navSide, setNavSide] = useState(() => {
    try { return localStorage.getItem('nav-side') === '1'; } catch { return false; }
  });
  const [labName, setLabName] = useState('');
  const [pwd, setPwd] = useState(false);

  useEffect(() => { settingsApi.get().then((s) => setLabName(s?.lab_name || '')).catch(() => {}); }, []);

  const toggleMenu = () => setNavSide((v) => {
    try { localStorage.setItem('nav-side', v ? '0' : '1'); } catch { /* not stored */ }
    return !v;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="no-print sticky top-0 z-20">
        <header className="relative z-10 flex items-center gap-3 border-b border-ink-100 bg-white/85 px-4 py-0.5 backdrop-blur-md lg:px-6">
          <button onClick={toggleMenu}
            className={`hidden rounded-lg p-1 transition-colors hover:bg-ink-100 lg:block ${navSide ? 'bg-ink-100 text-brand-700' : 'text-ink-600'}`}
            aria-label={navSide ? 'Move menu to the top' : 'Move menu to the left'} title={navSide ? 'Move menu to the top' : 'Move menu to the left'}>
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-ink-100">
              <img src="/favicon.svg" alt="" className="h-full w-full object-contain" />
            </span>
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="truncate font-display text-base font-bold tracking-tight text-brand-800 sm:text-lg">{labName || 'Ayush Lab'}</p>
              <p className="hidden truncate text-xs text-ink-300 md:block">Laboratory management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-2.5 py-0.5 text-11 text-ink-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Connected
            </div>
            <UserMenu onPassword={() => setPwd(true)} />
          </div>
        </header>
        <TopNav open side={navSide} />
      </div>
      <MobileMenu />

      <div className="flex min-h-0 flex-1">
        {navSide && <SideNav />}
        <main className="no-scrollbar min-w-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 lg:px-6 lg:pb-6 lg:pt-2">
          <div className="w-full animate-fade-in">
            <Outlet />
          </div>
          <div data-fab-spacer className="h-14 lg:hidden" />
        </main>
      </div>
      <ChangePassword open={pwd} onClose={() => setPwd(false)} />
    </div>
  );
}
