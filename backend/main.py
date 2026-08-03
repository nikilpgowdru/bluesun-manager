from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import models
import schemas
import crud
import seed

# Auto create database tables on launch
models.Base.metadata.create_all(bind=database.engine)

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

@app.get("/")
def read_root():
    return {"message": "Bluesun Manager ERP API is up and running!"}

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
    db: Session = Depends(database.get_db)
):
    return crud.get_goods(db, factory=factory, month=month)

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
