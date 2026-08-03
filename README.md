# Bluesun Manager ERP

A complete production-ready ERP system for managing manufacturing, sales, expenses, and account holders across three business units: **Jeans**, **Shirts**, and **Formals**.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v6, Lucide Icons
- **Backend**: FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic v2

---

## How to Run

### 1. Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
```
Backend will run at `http://localhost:8000`. The SQLite database (`bluesun.db`) will be automatically created and populated with demo seed data on initial launch.

### 2. Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173` and proxied to the FastAPI REST API.

---

## Features
- **Dashboard**: Live top metrics, month selector, factory summary table for Jeans, Shirts & Formals, automated system notifications, and recent goods.
- **Goods (Production History)**: Factory & Month filters, Add Goods modal, sortable table. Clicking any row opens Goods Details (No Batch IDs or Action columns as requested).
- **Goods Details**: Full production lot overview, sales history, and Add Sale modal (with conditional fields for Saving vs Expense receivers).
- **Transactions**: 3 filters only (*Sales*, *Expenses*, *Both*), month selector, sorted strictly ascending by date.
- **Account Holders**: Real-time calculated balances, Add Account Holder modal, complete account ledger history modal.
- **Expenses**: Factory & Month filters, expense history table (combining automatic sale expenses & manual deductions from account holders).
- **Reports**: Executive summary report with printable PDF styling (`@media print` ready).
