import { Share, PlusSquare, Download } from 'lucide-react';
import { Modal } from './ui.jsx';
import { useInstall } from '../utils/pwa.js';
import { useState } from 'react';

// iPhone / iPad: Safari has no install prompt, so explain the two taps.
export function IosInstallHelp({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Install Ayush Lab" size="sm"
      footer={<button className="btn-primary" onClick={onClose}>Got it</button>}>
      <ol className="space-y-3 text-sm text-ink-700">
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Share size={16} /></span>
          In Safari, tap the <b>Share</b> button.
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><PlusSquare size={16} /></span>
          Choose <b>Add to Home Screen</b>, then <b>Add</b>.
        </li>
      </ol>
      <p className="mt-3 text-12 text-ink-400">Ayush Lab then opens full screen from its home-screen icon.</p>
    </Modal>
  );
}

// "Install app" link for the sign-in page; hidden when already installed or
// when the browser can't install it.
export function InstallLink({ className = '' }) {
  const { canInstall, iosHint, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (!canInstall && !iosHint) return null;
  return (
    <>
      <button type="button" onClick={() => (canInstall ? install() : setHelp(true))}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-12 font-semibold text-white transition-colors hover:bg-white/20 ${className}`}>
        <Download size={13} /> Install app
      </button>
      <IosInstallHelp open={help} onClose={() => setHelp(false)} />
    </>
  );
}
