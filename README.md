# Ayush Lab (T_lap)

Mobile-first laboratory management system for clinical lab staff — patients, Test Master
(tests with components and male/female/general ranges), Test Fee Master, patient test
assignment, result entry and printable lab reports. Installable as a PWA.

- **frontend/** React 18 + Vite + Tailwind CSS (Ayush design system, phone Menu button, PWA)
- **backend/** Node 20 / Express API on SQL Server (`mssql`), JWT sign-in, role checks
  (Admin, Attendant, Assistant) enforced by the API
- **deploy/** paramiko deploy script and host nginx site

Setup, roles, tables and deployment: see [DEPLOY.md](DEPLOY.md).

Secrets live only in `backend/.env` (git-ignored); copy `backend/.env.example` to start.
