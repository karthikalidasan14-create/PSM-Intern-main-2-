# PSM Internship Certificate Verification Platform

Problem Solving Mind (PSM) intern portal with public certificate verification and an admin console.

The original Firebase pages (`index.html`, `verify.html`, `script.js`, `style.css`) are unchanged so the existing hosting flow keeps working. The full-stack app lives in `frontend/` and `backend/`.

## Stack

- React + Vite frontend
- Flask REST API
- MySQL (falls back to SQLite if MySQL is not running)
- JWT admin/mentor authentication
- QR codes and PDF certificates

## Default login

- Admin: `admin@problemsolvingmind.org` / `Admin@123`
- Mentor: `mentor@problemsolvingmind.org` / `Mentor@123`
- Sample intern: `PSMI012`
- Sample certificate: `PSM-CERT-PSMI012`

Change these after first login.

## MySQL setup

```sql
SOURCE database/schema.sql;
```

Update `backend/.env`:

```
DATABASE_URL=mysql+pymysql://USER:PASSWORD@127.0.0.1:3306/psm_internship
```

## Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r ..\requirements.txt
python app.py
```

API: `http://127.0.0.1:5000/api/health`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

Vite proxies `/api` to Flask.

## User panel

- `/` Home
- `/intern/:internId` Intern profile
- `/intern/:internId/project` Project overview
- `/intern/:internId/evaluation` Mentor evaluation
- `/verify` Certificate verification + QR scan
- `/certificate/:certificateId` Certificate preview and PDF download
- `/contact` Company contact

## Admin panel

- `/admin/login`
- `/admin` Dashboard
- `/admin/interns`
- `/admin/projects`
- `/admin/evaluations`
- `/admin/certificates`
- `/admin/settings`
