import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ConfirmProvider, Spinner } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Tests from './pages/Tests.jsx';
import Fees from './pages/Fees.jsx';
import Assignments from './pages/Assignments.jsx';
import AssignmentForm from './pages/AssignmentForm.jsx';
import Results from './pages/Results.jsx';
import Report from './pages/Report.jsx';
import UsersPage from './pages/Users.jsx';
import SettingsPage from './pages/Settings.jsx';

function Guard({ perm, children }) {
  const { can } = useAuth();
  if (perm && !can(perm)) {
    return <div className="card p-8 text-center text-sm text-ink-600">You don't have access to this screen. <Link className="font-semibold text-brand-700 underline" to="/">Go to dashboard</Link></div>;
  }
  return children;
}

export default function App() {
  const { isAuthenticated, checking } = useAuth();
  if (checking) return <Spinner label="Checking your session…" />;
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  return (
    <ConfirmProvider>
      <Routes>
        <Route path="/results/:assignmentId/print" element={<Report />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/assignments/new" element={<Guard perm="editAssignments"><AssignmentForm /></Guard>} />
          <Route path="/assignments/:id" element={<AssignmentForm />} />
          <Route path="/results" element={<Results />} />
          <Route path="/users" element={<Guard perm="manageUsers"><UsersPage /></Guard>} />
          <Route path="/settings" element={<Guard perm="manageSettings"><SettingsPage /></Guard>} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<div className="card p-8 text-center text-sm text-ink-600">Page not found. <Link className="font-semibold text-brand-700 underline" to="/">Go to dashboard</Link></div>} />
        </Route>
      </Routes>
    </ConfirmProvider>
  );
}
