from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
from fastapi import HTTPException

# Business Units
def get_business_units(db: Session):
    return db.query(models.BusinessUnit).all()

# Goods
def get_goods(db: Session, factory: str = None, month: str = None):
    query = db.query(models.Goods)
    if factory and factory != "All":
        query = query.filter(models.Goods.factory_name == factory)
    if month and month != "All":
        query = query.filter(models.Goods.manufacture_date.startswith(month))
    return query.order_by(models.Goods.manufacture_date.desc()).all()

def create_goods(db: Session, goods_in: schemas.GoodsCreate):
    goods = models.Goods(
        factory_name=goods_in.factory_name,
        type=goods_in.type,
        brand_name=goods_in.brand_name,
        manufacture_date=goods_in.manufacture_date,
        total_pcs=goods_in.total_pcs,
        rejected_pcs=goods_in.rejected_pcs,
        sold_pcs=0,
        total_earnings=0.0
    )
    db.add(goods)
    db.commit()
    db.refresh(goods)
    return goods

def get_goods_detail(db: Session, goods_id: int):
    goods = db.query(models.Goods).filter(models.Goods.id == goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods record not found")
    
    sales = db.query(models.Sale).filter(models.Sale.goods_id == goods_id).order_by(models.Sale.date.desc()).all()
    
    # Enrich sales with account holder name if any
    sales_out = []
    for s in sales:
        ah_name = None
        if s.account_holder_id:
            ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == s.account_holder_id).first()
            if ah:
                ah_name = ah.name
        sales_out.append(schemas.SaleOut(
            id=s.id,
            goods_id=s.goods_id,
            date=s.date,
            sold_to=s.sold_to,
            quantity=s.quantity,
            price=s.price,
            total_amount=s.total_amount,
            receipt=s.receipt,
            receiver=s.receiver,
            account_holder_id=s.account_holder_id,
            expense_description=s.expense_description,
            account_holder_name=ah_name
        ))

    goods_out = schemas.GoodsOut.model_validate(goods)
    return schemas.GoodsDetailOut(goods=goods_out, sales=sales_out)

# Sales
def create_sale(db: Session, goods_id: int, sale_in: schemas.SaleCreate):
    goods = db.query(models.Goods).filter(models.Goods.id == goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods record not found")
    
    if sale_in.quantity > goods.available_pcs:
        raise HTTPException(
            status_code=400, 
            detail=f"Requested quantity ({sale_in.quantity}) exceeds available stock ({goods.available_pcs})"
        )

    total_amount = round(sale_in.quantity * sale_in.price, 2)
    
    # 1. Update Goods
    goods.sold_pcs += sale_in.quantity
    goods.total_earnings += total_amount

    # 2. Create Sale
    sale = models.Sale(
        goods_id=goods.id,
        date=sale_in.date,
        sold_to=sale_in.sold_to,
        quantity=sale_in.quantity,
        price=sale_in.price,
        total_amount=total_amount,
        receipt=sale_in.receipt,
        receiver=sale_in.receiver,
        account_holder_id=sale_in.account_holder_id if sale_in.receiver == "Saving" else None,
        expense_description=sale_in.expense_description if sale_in.receiver == "Expense" else None
    )
    db.add(sale)
    db.flush()

    # 3. Create Transaction
    transaction_desc = f"Sale: {goods.brand_name} ({goods.type}) x {sale_in.quantity} pcs to {sale_in.sold_to}"
    tx = models.Transaction(
        date=sale_in.date,
        type="Sale",
        description=transaction_desc,
        amount=total_amount,
        factory_name=goods.factory_name,
        goods_id=goods.id,
        sales_id=sale.id,
        account_holder_id=sale_in.account_holder_id if sale_in.receiver == "Saving" else None
    )
    db.add(tx)

    # 4. Receiver Logic
    if sale_in.receiver == "Expense":
        # Create automatic Expense entry
        exp_desc = sale_in.expense_description or f"Expense from Sale of {goods.brand_name}"
        expense = models.Expense(
            factory_name=goods.factory_name,
            date=sale_in.date,
            expense_description=exp_desc,
            amount=total_amount,
            account_holder_id=None,
            is_from_sale=True
        )
        db.add(expense)
    elif sale_in.receiver == "Saving":
        if not sale_in.account_holder_id:
            raise HTTPException(status_code=400, detail="Account Holder selection required for Saving receiver")
        account_holder = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale_in.account_holder_id).first()
        if not account_holder:
            raise HTTPException(status_code=404, detail="Selected Account Holder not found")
        # Increase Account Holder balance
        account_holder.current_balance += total_amount

    db.commit()
    db.refresh(sale)
    return sale

# Transactions
def get_transactions(db: Session, filter_type: str = "Both", month: str = None):
    query = db.query(models.Transaction)
    
    if filter_type == "Sales":
        query = query.filter(models.Transaction.type == "Sale")
    elif filter_type == "Expenses":
        query = query.filter(models.Transaction.type == "Expense")
    # "Both" includes all

    if month and month != "All":
        query = query.filter(models.Transaction.date.startswith(month))

    # ALWAYS sorted by Date in ascending order per requirements
    transactions = query.order_by(models.Transaction.date.asc()).all()
    
    result = []
    for tx in transactions:
        ah_name = None
        if tx.account_holder_id:
            ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == tx.account_holder_id).first()
            if ah:
                ah_name = ah.name
        result.append(schemas.TransactionOut(
            id=tx.id,
            date=tx.date,
            type=tx.type,
            description=tx.description,
            amount=tx.amount,
            factory_name=tx.factory_name,
            goods_id=tx.goods_id,
            sales_id=tx.sales_id,
            expense_id=tx.expense_id,
            account_holder_id=tx.account_holder_id,
            account_holder_name=ah_name
        ))
    return result

# Account Holders
def get_account_holders(db: Session):
    return db.query(models.AccountHolder).all()

def create_account_holder(db: Session, ah_in: schemas.AccountHolderCreate):
    existing = db.query(models.AccountHolder).filter(models.AccountHolder.name == ah_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account Holder with this name already exists")
    ah = models.AccountHolder(name=ah_in.name, current_balance=ah_in.current_balance)
    db.add(ah)
    db.commit()
    db.refresh(ah)
    return ah

def get_account_history(db: Session, account_holder_id: int):
    ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == account_holder_id).first()
    if not ah:
        raise HTTPException(status_code=404, detail="Account Holder not found")
    
    txs = db.query(models.Transaction).filter(models.Transaction.account_holder_id == account_holder_id).order_by(models.Transaction.date.asc()).all()
    
    tx_outs = []
    for tx in txs:
        tx_outs.append(schemas.TransactionOut(
            id=tx.id,
            date=tx.date,
            type=tx.type,
            description=tx.description,
            amount=tx.amount,
            factory_name=tx.factory_name,
            goods_id=tx.goods_id,
            sales_id=tx.sales_id,
            expense_id=tx.expense_id,
            account_holder_id=tx.account_holder_id,
            account_holder_name=ah.name
        ))
    return schemas.AccountHistoryOut(
        account_holder=schemas.AccountHolderOut.model_validate(ah),
        transactions=tx_outs
    )

# Expenses
def get_expenses(db: Session, factory: str = None, month: str = None):
    query = db.query(models.Expense)
    if factory and factory != "All":
        query = query.filter(models.Expense.factory_name == factory)
    if month and month != "All":
        query = query.filter(models.Expense.date.startswith(month))
    
    expenses = query.order_by(models.Expense.date.desc()).all()
    
    result = []
    for exp in expenses:
        ah_name = None
        if exp.account_holder_id:
            ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == exp.account_holder_id).first()
            if ah:
                ah_name = ah.name
        result.append(schemas.ExpenseOut(
            id=exp.id,
            factory_name=exp.factory_name,
            date=exp.date,
            expense_description=exp.expense_description,
            amount=exp.amount,
            account_holder_id=exp.account_holder_id,
            is_from_sale=exp.is_from_sale,
            account_holder_name=ah_name
        ))
    return result

def create_manual_expense(db: Session, expense_in: schemas.ExpenseCreate):
    account_holder = db.query(models.AccountHolder).filter(models.AccountHolder.id == expense_in.account_holder_id).first()
    if not account_holder:
        raise HTTPException(status_code=404, detail="Selected Account Holder not found")

    # Reduce Account Holder balance
    account_holder.current_balance -= expense_in.amount

    # Create Expense entry
    expense = models.Expense(
        factory_name=expense_in.factory_name,
        date=expense_in.date,
        expense_description=expense_in.expense_description,
        amount=expense_in.amount,
        account_holder_id=account_holder.id,
        is_from_sale=False
    )
    db.add(expense)
    db.flush()

    # Create Transaction entry
    tx = models.Transaction(
        date=expense_in.date,
        type="Expense",
        description=f"Manual Expense: {expense_in.expense_description} (Deducted from {account_holder.name})",
        amount=expense_in.amount,
        factory_name=expense_in.factory_name,
        expense_id=expense.id,
        account_holder_id=account_holder.id
    )
    db.add(tx)

    db.commit()
    db.refresh(expense)
    return expense

# Dashboard Stats
def get_dashboard_stats(db: Session, month: str = None):
    # Base queries for Goods, Sales, Expenses
    goods_query = db.query(models.Goods)
    sales_query = db.query(models.Sale)
    expenses_query = db.query(models.Expense)

    if month and month != "All":
        goods_query = goods_query.filter(models.Goods.manufacture_date.startswith(month))
        sales_query = sales_query.filter(models.Sale.date.startswith(month))
        expenses_query = expenses_query.filter(models.Expense.date.startswith(month))

    all_goods = goods_query.all()
    all_sales = sales_query.all()
    all_expenses = expenses_query.all()

    overall_available_stock = sum(g.available_pcs for g in all_goods)
    total_sales = sum(s.total_amount for s in all_sales)
    total_expenses = sum(e.amount for e in all_expenses)
    net_profit = round(total_sales - total_expenses, 2)

    # Calculate Factory Summaries for the 3 factories
    factories = ["Jeans", "Shirts", "Formals"]
    factory_summaries = []

    for f in factories:
        f_goods = [g for g in all_goods if g.factory_name == f]
        f_sales = [s for s in all_sales if s.goods and s.goods.factory_name == f]
        f_expenses = [e for e in all_expenses if e.factory_name == f]

        f_stock = sum(g.available_pcs for g in f_goods)
        f_sales_amount = sum(s.total_amount for s in f_sales)
        f_exp_amount = sum(e.amount for e in f_expenses)
        f_profit = round(f_sales_amount - f_exp_amount, 2)

        factory_summaries.append(schemas.FactorySummary(
            factory=f,
            available_stock=f_stock,
            sales=f_sales_amount,
            expenses=f_exp_amount,
            profit=f_profit
        ))

    # Recent Goods (last 5 created or manufactured)
    recent_goods = db.query(models.Goods).order_by(models.Goods.manufacture_date.desc(), models.Goods.id.desc()).limit(5).all()
    recent_goods_out = [schemas.GoodsOut.model_validate(g) for g in recent_goods]

    # Automated Notifications
    notifications = []
    low_stock_goods = [g for g in all_goods if g.available_pcs < 50]
    if low_stock_goods:
        notifications.append(schemas.Notification(
            id="low_stock_1",
            type="warning",
            title="Low Stock Alert",
            message=f"{len(low_stock_goods)} product items have stock below 50 PCS.",
            date="Today"
        ))
    if net_profit >= 0:
        notifications.append(schemas.Notification(
            id="profit_1",
            type="success",
            title="Positive Cashflow",
            message=f"Net profit for the selected period stands at ${net_profit:,.2f}.",
            date="Today"
        ))
    else:
        notifications.append(schemas.Notification(
            id="profit_loss",
            type="warning",
            title="Deficit Alert",
            message=f"Expenses exceed sales by ${abs(net_profit):,.2f} for the selected period.",
            date="Today"
        ))

    notifications.append(schemas.Notification(
        id="factory_active",
        type="info",
        title="Production Sync",
        message="All 3 factory lines (Jeans, Shirts, Formals) are synchronized.",
        date="Today"
    ))

    return schemas.DashboardStats(
        overall_available_stock=overall_available_stock,
        total_sales=total_sales,
        total_expenses=total_expenses,
        net_profit=net_profit,
        factory_summaries=factory_summaries,
        recent_goods=recent_goods_out,
        notifications=notifications
    )

# Reports Data
def get_report_data(db: Session, month: str = None, factory: str = None):
    goods_q = db.query(models.Goods)
    sales_q = db.query(models.Sale)
    exp_q = db.query(models.Expense)

    if factory and factory != "All":
        goods_q = goods_q.filter(models.Goods.factory_name == factory)
        exp_q = exp_q.filter(models.Expense.factory_name == factory)

    if month and month != "All":
        goods_q = goods_q.filter(models.Goods.manufacture_date.startswith(month))
        sales_q = sales_q.filter(models.Sale.date.startswith(month))
        exp_q = exp_q.filter(models.Expense.date.startswith(month))

    goods_list = goods_q.all()
    sales_list = sales_q.all()
    if factory and factory != "All":
        sales_list = [s for s in sales_list if s.goods and s.goods.factory_name == factory]
    exp_list = exp_q.all()

    stock = sum(g.available_pcs for g in goods_list)
    sales = sum(s.total_amount for s in sales_list)
    expenses = sum(e.amount for e in exp_list)
    profit = round(sales - expenses, 2)

    # Breakdown by factory
    factories = ["Jeans", "Shirts", "Formals"] if (not factory or factory == "All") else [factory]
    breakdown = []
    for f in factories:
        fg = [g for g in goods_list if g.factory_name == f]
        fs = [s for s in sales_list if s.goods and s.goods.factory_name == f]
        fe = [e for e in exp_list if e.factory_name == f]
        breakdown.append(schemas.FactorySummary(
            factory=f,
            available_stock=sum(g.available_pcs for g in fg),
            sales=sum(s.total_amount for s in fs),
            expenses=sum(e.amount for e in fe),
            profit=round(sum(s.total_amount for s in fs) - sum(e.amount for e in fe), 2)
        ))

    top_goods = sorted(goods_list, key=lambda x: x.total_earnings, reverse=True)[:5]
    top_goods_out = [schemas.GoodsOut.model_validate(g) for g in top_goods]

    return schemas.ReportOut(
        month=month or "All Time",
        factory=factory or "All Factories",
        available_stock=stock,
        total_sales=sales,
        total_expenses=expenses,
        net_profit=profit,
        factory_breakdown=breakdown,
        top_goods=top_goods_out
    )
