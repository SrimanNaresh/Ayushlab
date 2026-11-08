import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const initialToken = read('labToken') || '';
setAuthToken(initialToken);

// What each role may do. The server enforces the same rules; this only hides
// buttons a user can't use.
export const PERMS = {
  manageUsers: ['Admin'],
  manageSettings: ['Admin'],
  editTests: ['Admin'],
  editFees: ['Admin'],
  editPatients: ['Admin', 'Attendant'],
  deletePatients: ['Admin'],
  editAssignments: ['Admin', 'Attendant'],
  deleteAssignments: ['Admin'],
  enterResults: ['Admin', 'Assistant'],
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(read('labUser') || 'null'); } catch { return null; }
  });
  const [checking, setChecking] = useState(!!initialToken);

  const logout = useCallback(() => {
    setAuthToken('');
    try { localStorage.removeItem('labToken'); localStorage.removeItem('labUser'); } catch { /* blocked */ }
    setToken('');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!initialToken) return;
    authApi.me()
      .then((me) => { setUser(me); try { localStorage.setItem('labUser', JSON.stringify(me)); } catch { /* blocked */ } })
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    setAuthToken(res.token);
    try { localStorage.setItem('labToken', res.token); localStorage.setItem('labUser', JSON.stringify(res.user)); } catch { /* blocked */ }
    setToken(res.token);
    setUser(res.user);
  }, []);

  const can = useCallback((perm) => !!user && (PERMS[perm] || []).includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{ token, user, checking, isAuthenticated: !!token && !!user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
