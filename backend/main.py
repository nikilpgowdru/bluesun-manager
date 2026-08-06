from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import models
import schemas
import crud
import seed

from sqlalchemy import text, inspect

# Auto create database tables on launch
models.Base.metadata.create_all(bind=database.engine)

# Auto migrate existing tables for new GST and Balance columns
def run_auto_migrations(engine):
    try:
        inspector = inspect(engine)
        with engine.begin() as conn:
            if inspector.has_table('sales'):
                columns = [c['name'] for c in inspector.get_columns('sales')]
                if 'gst_percent' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN gst_percent FLOAT DEFAULT 0.0"))
                    except Exception as e:
                        print("Migration gst_percent info:", e)
                if 'gst_amount' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN gst_amount FLOAT DEFAULT 0.0"))
                    except Exception as e:
                        print("Migration gst_amount info:", e)
                if 'payment_status' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN payment_status VARCHAR DEFAULT 'Paid'"))
                    except Exception as e:
                        print("Migration payment_status info:", e)
                if 'paid_amount' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN paid_amount FLOAT DEFAULT 0.0"))
                    except Exception as e:
                        print("Migration paid_amount info:", e)
                if 'balance_due' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN balance_due FLOAT DEFAULT 0.0"))
                    except Exception as e:
                        print("Migration balance_due info:", e)
                if 'batch_number' not in columns:
                    try:
                        conn.execute(text("ALTER TABLE sales ADD COLUMN batch_number VARCHAR DEFAULT ''"))
                    except Exception as e:
                        print("Migration sales batch_number info:", e)

            if inspector.has_table("goods"):
                g_columns = [col['name'] for col in inspector.get_columns("goods")]
                if 'batch_number' not in g_columns:
                    try:
                        conn.execute(text("ALTER TABLE goods ADD COLUMN batch_number VARCHAR DEFAULT 'BATCH-DEFAULT'"))
                    except Exception as e:
                        print("Migration goods batch_number info:", e)
    except Exception as err:
        print("Auto-migration exception:", err)

run_auto_migrations(database.engine)

# Seed sample data on launch
db_session = database.SessionLocal()
try:
    seed.seed_db(db_session)
finally:
    db_session.close()

app = FastAPI(title="Bluesun Manager ERP API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files route will be mounted at the end after API endpoints



# 1. Business Units
@app.get("/api/business-units", response_model=List[schemas.BusinessUnitOut])
def get_business_units(db: Session = Depends(database.get_db)):
    return crud.get_business_units(db)

# 2. Dashboard
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    month: Optional[str] = Query(None, description="Month format YYYY-MM or 'All'"),
    db: Session = Depends(database.get_db)
):
    return crud.get_dashboard_stats(db, month=month)

# 3. Goods (Production History)
@app.get("/api/goods", response_model=List[schemas.GoodsOut])
def get_goods(
    factory: Optional[str] = Query(None, description="Jeans, Shirts, Formals, or All"),
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    batch: Optional[str] = Query(None, description="Batch number or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_goods(db, factory=factory, month=month, batch=batch)

@app.post("/api/goods", response_model=schemas.GoodsOut, status_code=201)
def create_goods(
    goods_in: schemas.GoodsCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_goods(db, goods_in)

@app.get("/api/goods/{goods_id}", response_model=schemas.GoodsDetailOut)
def get_goods_detail(
    goods_id: int,
    db: Session = Depends(database.get_db)
):
    return crud.get_goods_detail(db, goods_id)

@app.post("/api/goods/{goods_id}/sales", response_model=schemas.SaleOut, status_code=201)
def create_sale(
    goods_id: int,
    sale_in: schemas.SaleCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_sale(db, goods_id, sale_in)

# 3b. Sales Section Endpoints
@app.get("/api/sales/summary", response_model=schemas.SalesSummaryOut)
def get_sales_summary(
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_sales_summary(db, month=month)

@app.get("/api/sales", response_model=List[schemas.SaleOut])
def get_all_sales(
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_all_sales(db, month=month)

@app.post("/api/sales/multi", response_model=List[schemas.SaleOut], status_code=201)
def create_multi_sale(
    multi_in: schemas.MultiSaleCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_multi_item_sale(db, multi_in)

@app.delete("/api/sales/{sale_id}")
def delete_sale_endpoint(
    sale_id: int,
    db: Session = Depends(database.get_db)
):
    return crud.delete_sale(db, sale_id)

# 4. Transactions
@app.get("/api/transactions", response_model=List[schemas.TransactionOut])
def get_transactions(
    filter_type: str = Query("Both", description="Sales, Expenses, or Both"),
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    db: Session = Depends(database.get_db)
):
    if filter_type not in ["Sales", "Expenses", "Both"]:
        raise HTTPException(status_code=400, detail="filter_type must be Sales, Expenses, or Both")
    return crud.get_transactions(db, filter_type=filter_type, month=month)

# 5. Account Holders
@app.get("/api/account-holders", response_model=List[schemas.AccountHolderOut])
def get_account_holders(db: Session = Depends(database.get_db)):
    return crud.get_account_holders(db)

@app.post("/api/account-holders", response_model=schemas.AccountHolderOut, status_code=201)
def create_account_holder(
    ah_in: schemas.AccountHolderCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_account_holder(db, ah_in)

@app.get("/api/account-holders/{account_holder_id}/history", response_model=schemas.AccountHistoryOut)
def get_account_history(
    account_holder_id: int,
    db: Session = Depends(database.get_db)
):
    return crud.get_account_history(db, account_holder_id)

@app.post("/api/account-holders/{account_holder_id}/adjust", response_model=schemas.AccountHolderOut)
def adjust_account_holder_balance(
    account_holder_id: int,
    adjust_in: schemas.AccountHolderAdjust,
    db: Session = Depends(database.get_db)
):
    return crud.adjust_account_holder_balance(db, account_holder_id, adjust_in)

# 6. Expenses
@app.get("/api/expenses", response_model=List[schemas.ExpenseOut])
def get_expenses(
    factory: Optional[str] = Query(None, description="Jeans, Shirts, Formals, or All"),
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_expenses(db, factory=factory, month=month)

@app.post("/api/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_manual_expense(
    expense_in: schemas.ExpenseCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_manual_expense(db, expense_in)

# 7. Reports
@app.get("/api/reports", response_model=schemas.ReportOut)
def get_reports(
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    factory: Optional[str] = Query(None, description="Jeans, Shirts, Formals, or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_report_data(db, month=month, factory=factory)

# 8. Pending Balances (Pay Later)
@app.get("/api/balances", response_model=List[schemas.PendingBalanceOut])
def get_pending_balances(db: Session = Depends(database.get_db)):
    return crud.get_pending_balances(db)

@app.post("/api/sales/{sale_id}/settle", response_model=schemas.SaleOut)
def settle_sale_balance(
    sale_id: int,
    settle_in: schemas.SettleBalanceIn,
    db: Session = Depends(database.get_db)
):
    return crud.settle_sale_balance(db, sale_id, settle_in)

# 9. Chansandra Section
@app.get("/api/chansandra", response_model=schemas.ChansandraSummary)
def get_chansandra_summary(
    month: Optional[str] = Query(None, description="Month format YYYY-MM or All"),
    db: Session = Depends(database.get_db)
):
    return crud.get_chansandra_summary(db, month=month)

@app.post("/api/chansandra", response_model=schemas.ChansandraEntryOut, status_code=201)
def create_chansandra_entry(
    entry_in: schemas.ChansandraEntryCreate,
    db: Session = Depends(database.get_db)
):
    return crud.create_chansandra_entry(db, entry_in)

@app.delete("/api/chansandra/{entry_id}")
def delete_chansandra_entry(
    entry_id: int,
    db: Session = Depends(database.get_db)
):
    return crud.delete_chansandra_entry(db, entry_id)

# 10. Update Endpoints
@app.put("/api/goods/{goods_id}", response_model=schemas.GoodsOut)
def update_goods(goods_id: int, goods_in: schemas.GoodsUpdate, db: Session = Depends(database.get_db)):
    return crud.update_goods(db, goods_id, goods_in)

@app.put("/api/sales/{sale_id}", response_model=schemas.SaleOut)
def update_sale(sale_id: int, sale_in: schemas.SaleUpdate, db: Session = Depends(database.get_db)):
    return crud.update_sale(db, sale_id, sale_in)

@app.put("/api/account-holders/{account_holder_id}", response_model=schemas.AccountHolderOut)
def update_account_holder(account_holder_id: int, ah_in: schemas.AccountHolderUpdate, db: Session = Depends(database.get_db)):
    return crud.update_account_holder(db, account_holder_id, ah_in)

@app.put("/api/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, exp_in: schemas.ExpenseUpdate, db: Session = Depends(database.get_db)):
    return crud.update_expense(db, expense_id, exp_in)

# 9. Delete Endpoints
@app.delete("/api/goods/{goods_id}")
def delete_goods(goods_id: int, db: Session = Depends(database.get_db)):
    return crud.delete_goods(db, goods_id)

@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(database.get_db)):
    return crud.delete_sale(db, sale_id)

@app.delete("/api/account-holders/{account_holder_id}")
def delete_account_holder(account_holder_id: int, db: Session = Depends(database.get_db)):
    return crud.delete_account_holder(db, account_holder_id)

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db)):
    return crud.delete_expense(db, expense_id)

# 10. Fresh Setup Reset & Seed Database Endpoints
@app.post("/api/reset-database")
def reset_database(db: Session = Depends(database.get_db)):
    return crud.reset_database(db)

@app.post("/api/seed-database")
@app.get("/api/seed-database")
def seed_database_endpoint(db: Session = Depends(database.get_db)):
    db.query(models.Transaction).delete()
    db.query(models.Sale).delete()
    db.query(models.Expense).delete()
    db.query(models.ChansandraEntry).delete()
    db.query(models.Goods).delete()
    db.query(models.AccountHolder).delete()
    db.query(models.BusinessUnit).delete()
    db.commit()
    seed.seed_db(db)
    return {"message": "All default data successfully restored!"}

# 11. Cloud Backup Endpoint (5TB Storage Sync)
@app.get("/api/cloud/export-backup")
def export_cloud_backup(db: Session = Depends(database.get_db)):
    return crud.export_backup(db)



# Static Frontend & Catch-All SPA Route (Must be after all /api/ endpoints)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def catch_all(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

