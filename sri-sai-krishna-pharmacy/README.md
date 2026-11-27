# Sri Sai Krishna Medical & General Stores - Pharmacy Management System
Angular (frontend) + FastAPI (Python API) + Microsoft SQL Server.

## 1. Database
Run `backend/schema.sql` in SQL Server (creates DB `SriSaiPharmacy`, tables, roles, seed admin).

## 2. Backend
cd backend && python -m venv .venv && source .venv/bin/activate   (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
copy .env.example to .env and fill in DB + SMTP values
uvicorn main:app --reload        -> http://localhost:8000/docs
Seed login: admin / Admin@123  (change immediately)

## 3. Frontend
cd frontend && npm install && npm start   -> http://localhost:4200
Update store phone/email/address in src/app/store.config.ts.

Scope in this export: public site (6 pages), JWT auth with roles, medicines CRUD, billing (FEFO stock deduction), contact/support email.
Next: admin dashboard UI, customers/suppliers/orders/reports screens (tables already in schema).
