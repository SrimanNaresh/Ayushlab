# Ayush Lab (T_lap) – Laboratory Management System

| | |
|---|---|
| URL | https://ayushlab.thangaminfotech.com |
| Server | 156.67.104.242, folder `/opt/projects/ayushlab` |
| Containers | `ayushlab-frontend` (127.0.0.1:3140) / `ayushlab-backend` (127.0.0.1:5140), compose project `ayushlab` |
| nginx | `/etc/nginx/sites-available/ayushlab.conf` (from `deploy/nginx-site.conf`) |
| Database | `T_lap` on 147.93.155.21 (SQL Server, settings in `backend/.env`) |
| First login | user `Admin`; the first password is `INITIAL_ADMIN_PASSWORD` in `backend/.env` (not in git). Change it after signing in (account menu → Change password). |

Registered in `../PORT_REGISTRY.md`.

## Stack
- **frontend/** React 18 + Vite + Tailwind, served by nginx in its container.
- **backend/** Node 20 / Express API with `mssql`. The browser never talks to SQL Server; the
  connection string and JWT secret live only in `backend/.env` on the server.
- Sign-in with JWT (12 h). Every API call re-checks the user is active and its role.

## Roles (enforced by the API, mirrored in the UI)
| Action | Admin | Attendant | Assistant |
|---|:-:|:-:|:-:|
| View patients, tests, fees, assignments, results; print completed reports | ✔ | ✔ | ✔ |
| Register / edit / import patients | ✔ | ✔ | |
| Create / edit test assignments | ✔ | ✔ | |
| Update sample / test status | ✔ | ✔ | ✔ |
| Enter and complete results | ✔ | | ✔ |
| Test Master, Test Fee Master, delete patients/assignments, users, lab settings | ✔ | | |

## Tables (`T_lap`)
`app_users`, `lab_settings`, `test_master` → `test_components`, `test_fees` (1:1 with test),
`patients`, `test_assignments` → `assignment_tests` (price snapshot), `patient_results` (1 per
assignment) → `result_values` (copy of component name/ranges so old reports still print).
Checks enforce amounts ≥ 0, discount ≤ fee, valid statuses/gender/email, DOB ≤ registration date.
A patient with assignments, or a test that has been assigned, cannot be deleted.

## Deploy / redeploy
From this folder (backs up the old server folder, rebuilds only this app's containers, adds only
its own nginx site and runs `nginx -t` before reloading):

```
set DEPLOY_PASSWORD=<root password>
python deploy/deploy.py --init-db
```

`--init-db` runs `backend/src/db/initDb.js`, which creates the database/tables only when missing,
so it is safe to re-run.

## Checks
With the API running: `cd backend && set API_URL=http://localhost:5000 && npm run check`
(53 end-to-end checks: validation, relationships, role permissions, result/print rules). It
creates its own records and deletes them afterwards.

## Local development
```
cd backend && npm install && npm run dev       # API on :5000
cd frontend && npm install && npm run dev      # web on :5173, proxies /api
```
