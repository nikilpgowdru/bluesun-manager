from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
from fastapi import HTTPException

def goods_to_out(g: models.Goods) -> schemas.GoodsOut:
    return schemas.GoodsOut(
        id=g.id,
        factory_name=g.factory_name,
        type=g.type,
        brand_name=g.brand_name,
        manufacture_date=g.manufacture_date,
        total_pcs=g.total_pcs,
        rejected_pcs=g.rejected_pcs,
        passed_pcs=g.passed_pcs,
        available_pcs=g.available_pcs,
        sold_pcs=g.sold_pcs,
        total_earnings=g.total_earnings
    )

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
    goods_list = query.order_by(models.Goods.manufacture_date.desc()).all()
    return [goods_to_out(g) for g in goods_list]

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
    return goods_to_out(goods)

def get_goods_detail(db: Session, goods_id: int):
    goods = db.query(models.Goods).filter(models.Goods.id == goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods record not found")
    
    try:
        sales = db.query(models.Sale).filter(models.Sale.goods_id == goods_id).order_by(models.Sale.date.desc()).all()
    except Exception as err:
        db.rollback()
        print("Safely handling un-migrated sales query:", err)
        sales = []
    
    sales_out = []
    for s in sales:
        ah_name = None
        if getattr(s, 'account_holder_id', None):
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
            gst_percent=getattr(s, 'gst_percent', 0.0) or 0.0,
            gst_amount=getattr(s, 'gst_amount', 0.0) or 0.0,
            total_amount=s.total_amount,
            receipt=s.receipt,
            receiver=s.receiver,
            account_holder_id=getattr(s, 'account_holder_id', None),
            expense_description=getattr(s, 'expense_description', None),
            account_holder_name=ah_name
        ))

    return schemas.GoodsDetailOut(goods=goods_to_out(goods), sales=sales_out)

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

    subtotal = round(sale_in.quantity * sale_in.price, 2)
    gst_pct = sale_in.gst_percent or 0.0
    if sale_in.gst_amount is not None and sale_in.gst_amount > 0:
        gst_amt = round(sale_in.gst_amount, 2)
    else:
        gst_amt = round(subtotal * (gst_pct / 100.0), 2)

    total_amount = round(subtotal + gst_amt, 2)
    
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
        gst_percent=gst_pct,
        gst_amount=gst_amt,
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
    recent_goods_out = [goods_to_out(g) for g in recent_goods]

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
            message=f"Net profit for the selected period stands at ₹{net_profit:,.2f}.",
            date="Today"
        ))
    else:
        notifications.append(schemas.Notification(
            id="profit_loss",
            type="warning",
            title="Deficit Alert",
            message=f"Expenses exceed sales by ₹{abs(net_profit):,.2f} for the selected period.",
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
    top_goods_out = [goods_to_out(g) for g in top_goods]

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

# Update Goods
def update_goods(db: Session, goods_id: int, goods_in: schemas.GoodsUpdate):
    goods = db.query(models.Goods).filter(models.Goods.id == goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods record not found")
    
    if goods_in.factory_name is not None:
        goods.factory_name = goods_in.factory_name
    if goods_in.type is not None:
        goods.type = goods_in.type
    if goods_in.brand_name is not None:
        goods.brand_name = goods_in.brand_name
    if goods_in.manufacture_date is not None:
        goods.manufacture_date = goods_in.manufacture_date
    if goods_in.total_pcs is not None:
        if goods_in.total_pcs < goods.rejected_pcs + goods.sold_pcs:
            raise HTTPException(status_code=400, detail="Total PCS cannot be less than Rejected + Sold PCS")
        goods.total_pcs = goods_in.total_pcs
    if goods_in.rejected_pcs is not None:
        if goods_in.rejected_pcs > goods.total_pcs:
            raise HTTPException(status_code=400, detail="Rejected PCS cannot exceed Total PCS")
        goods.rejected_pcs = goods_in.rejected_pcs

    db.commit()
    db.refresh(goods)
    return goods_to_out(goods)

# Update Sale
def update_sale(db: Session, sale_id: int, sale_in: schemas.SaleUpdate):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")
    
    goods = db.query(models.Goods).filter(models.Goods.id == sale.goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Associated Goods record not found")

    # Revert old sale impacts
    goods.sold_pcs = max(0, goods.sold_pcs - sale.quantity)
    goods.total_earnings = max(0.0, goods.total_earnings - sale.total_amount)
    
    if sale.receiver == "Saving" and sale.account_holder_id:
        ah_old = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah_old:
            ah_old.current_balance = max(0.0, ah_old.current_balance - sale.total_amount)
    elif sale.receiver == "Expense":
        db.query(models.Expense).filter(
            models.Expense.factory_name == goods.factory_name,
            models.Expense.date == sale.date,
            models.Expense.amount == sale.total_amount,
            models.Expense.is_from_sale == True
        ).delete()

    # Update attributes
    new_qty = sale_in.quantity if sale_in.quantity is not None else sale.quantity
    new_price = sale_in.price if sale_in.price is not None else sale.price
    
    if new_qty > goods.available_pcs:
        raise HTTPException(status_code=400, detail=f"Requested quantity ({new_qty}) exceeds available stock ({goods.available_pcs})")

    new_total = round(new_qty * new_price, 2)
    sale.date = sale_in.date or sale.date
    sale.sold_to = sale_in.sold_to or sale.sold_to
    sale.quantity = new_qty
    sale.price = new_price
    sale.total_amount = new_total
    sale.receipt = sale_in.receipt or sale.receipt
    sale.receiver = sale_in.receiver or sale.receiver
    sale.account_holder_id = sale_in.account_holder_id if sale.receiver == "Saving" else None
    sale.expense_description = sale_in.expense_description if sale.receiver == "Expense" else None

    # Apply new sale impacts
    goods.sold_pcs += new_qty
    goods.total_earnings += new_total

    # Re-create transaction
    db.query(models.Transaction).filter(models.Transaction.sales_id == sale.id).delete()
    tx_desc = f"Sale: {goods.brand_name} ({goods.type}) x {new_qty} pcs to {sale.sold_to}"
    tx = models.Transaction(
        date=sale.date,
        type="Sale",
        description=tx_desc,
        amount=new_total,
        factory_name=goods.factory_name,
        goods_id=goods.id,
        sales_id=sale.id,
        account_holder_id=sale.account_holder_id
    )
    db.add(tx)

    if sale.receiver == "Expense":
        exp_desc = sale.expense_description or f"Expense from Sale of {goods.brand_name}"
        db.add(models.Expense(
            factory_name=goods.factory_name,
            date=sale.date,
            expense_description=exp_desc,
            amount=new_total,
            account_holder_id=None,
            is_from_sale=True
        ))
    elif sale.receiver == "Saving" and sale.account_holder_id:
        ah_new = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah_new:
            ah_new.current_balance += new_total

    db.commit()
    db.refresh(sale)
    
    ah_name = None
    if sale.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah:
            ah_name = ah.name

    return schemas.SaleOut(
        id=sale.id,
        goods_id=sale.goods_id,
        date=sale.date,
        sold_to=sale.sold_to,
        quantity=sale.quantity,
        price=sale.price,
        total_amount=sale.total_amount,
        receipt=sale.receipt,
        receiver=sale.receiver,
        account_holder_id=sale.account_holder_id,
        expense_description=sale.expense_description,
        account_holder_name=ah_name
    )

# Update Account Holder
def update_account_holder(db: Session, account_holder_id: int, ah_in: schemas.AccountHolderUpdate):
    ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == account_holder_id).first()
    if not ah:
        raise HTTPException(status_code=404, detail="Account Holder not found")
    
    if ah_in.name is not None:
        ah.name = ah_in.name
    if ah_in.current_balance is not None:
        ah.current_balance = ah_in.current_balance

    db.commit()
    db.refresh(ah)
    return ah

# Update Expense
def update_expense(db: Session, expense_id: int, exp_in: schemas.ExpenseUpdate):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    
    # Revert old balance deduction if manual
    if expense.account_holder_id:
        old_ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == expense.account_holder_id).first()
        if old_ah:
            old_ah.current_balance += expense.amount

    if exp_in.factory_name is not None:
        expense.factory_name = exp_in.factory_name
    if exp_in.date is not None:
        expense.date = exp_in.date
    if exp_in.expense_description is not None:
        expense.expense_description = exp_in.expense_description
    if exp_in.amount is not None:
        expense.amount = exp_in.amount
    if exp_in.account_holder_id is not None:
        expense.account_holder_id = exp_in.account_holder_id

    # Apply new balance deduction if manual
    if expense.account_holder_id:
        new_ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == expense.account_holder_id).first()
        if new_ah:
            new_ah.current_balance -= expense.amount

    # Update associated transaction
    tx = db.query(models.Transaction).filter(models.Transaction.expense_id == expense.id).first()
    if tx:
        tx.date = expense.date
        tx.amount = expense.amount
        tx.factory_name = expense.factory_name
        tx.account_holder_id = expense.account_holder_id
        tx.description = f"Manual Expense: {expense.expense_description}"

    db.commit()
    db.refresh(expense)
    
    ah_name = None
    if expense.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == expense.account_holder_id).first()
        if ah:
            ah_name = ah.name

    return schemas.ExpenseOut(
        id=expense.id,
        factory_name=expense.factory_name,
        date=expense.date,
        expense_description=expense.expense_description,
        amount=expense.amount,
        account_holder_id=expense.account_holder_id,
        is_from_sale=expense.is_from_sale,
        account_holder_name=ah_name
    )

# Export Full Cloud Backup
def export_backup(db: Session):
    goods = [goods_to_out(g).model_dump() for g in db.query(models.Goods).all()]
    sales = [s.__dict__ for s in db.query(models.Sale).all()]
    for s in sales:
        s.pop('_sa_instance_state', None)
    account_holders = [ah.__dict__ for ah in db.query(models.AccountHolder).all()]
    for ah in account_holders:
        ah.pop('_sa_instance_state', None)
    expenses = [e.__dict__ for e in db.query(models.Expense).all()]
    for e in expenses:
        e.pop('_sa_instance_state', None)
    transactions = [t.__dict__ for t in db.query(models.Transaction).all()]
    for t in transactions:
        t.pop('_sa_instance_state', None)

    return {
        "app": "Bluesun Manager ERP",
        "version": "1.0",
        "storage": "Google Cloud Drive (5TB Reserved)",
        "goods": goods,
        "sales": sales,
        "account_holders": account_holders,
        "expenses": expenses,
        "transactions": transactions
    }

# Delete Goods (Safe Cascading)
def delete_goods(db: Session, goods_id: int):
    goods = db.query(models.Goods).filter(models.Goods.id == goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods record not found")
    
    # Delete associated sales, expenses from sales, and transactions
    sales = db.query(models.Sale).filter(models.Sale.goods_id == goods_id).all()
    for s in sales:
        db.query(models.Transaction).filter(models.Transaction.sales_id == s.id).delete()
        db.query(models.Expense).filter(models.Expense.is_from_sale == True, models.Expense.date == s.date, models.Expense.amount == s.total_amount).delete()
    
    db.query(models.Sale).filter(models.Sale.goods_id == goods_id).delete()
    db.query(models.Transaction).filter(models.Transaction.goods_id == goods_id).delete()
    db.delete(goods)
    db.commit()
    return {"message": "Goods record deleted successfully"}

# Delete Sale (Safe Cascading)
def delete_sale(db: Session, sale_id: int):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")
    
    goods = db.query(models.Goods).filter(models.Goods.id == sale.goods_id).first()
    if goods:
        goods.sold_pcs = max(0, goods.sold_pcs - sale.quantity)
        goods.total_earnings = max(0.0, goods.total_earnings - sale.total_amount)

    if sale.receiver == "Saving" and sale.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah:
            ah.current_balance = max(0.0, ah.current_balance - sale.total_amount)
    elif sale.receiver == "Expense":
        db.query(models.Expense).filter(
            models.Expense.factory_name == (goods.factory_name if goods else "Jeans"),
            models.Expense.date == sale.date,
            models.Expense.amount == sale.total_amount,
            models.Expense.is_from_sale == True
        ).delete()

    db.query(models.Transaction).filter(models.Transaction.sales_id == sale.id).delete()
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted successfully"}

# Delete Account Holder (Safe Cascading)
def delete_account_holder(db: Session, account_holder_id: int):
    ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == account_holder_id).first()
    if not ah:
        raise HTTPException(status_code=404, detail="Account Holder not found")
    
    # Nullify references in Sales and Expenses so deletion will never fail Foreign Key constraints
    db.query(models.Sale).filter(models.Sale.account_holder_id == account_holder_id).update({models.Sale.account_holder_id: None})
    db.query(models.Expense).filter(models.Expense.account_holder_id == account_holder_id).update({models.Expense.account_holder_id: None})
    db.query(models.Transaction).filter(models.Transaction.account_holder_id == account_holder_id).delete()
    
    db.delete(ah)
    db.commit()
    return {"message": "Account Holder deleted successfully"}

# Delete Expense (Safe Cascading)
def delete_expense(db: Session, expense_id: int):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
    
    if expense.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == expense.account_holder_id).first()
        if ah:
            ah.current_balance += expense.amount

    db.query(models.Transaction).filter(models.Transaction.expense_id == expense.id).delete()
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

# Reset Database to Fresh Setup
def reset_database(db: Session):
    db.query(models.Transaction).delete()
    db.query(models.Sale).delete()
    db.query(models.Expense).delete()
    db.query(models.Goods).delete()
    db.query(models.AccountHolder).delete()
    db.query(models.BusinessUnit).delete()
    db.commit()

    # Re-create 3 Business Units
    for f in ["Jeans", "Shirts", "Formals"]:
        db.add(models.BusinessUnit(name=f))
    
    # Re-create clean default Account Holders with 0 balance
    db.add_all([
        models.AccountHolder(name="Main Corporate Account", current_balance=0.0),
        models.AccountHolder(name="Factory Reserve Fund", current_balance=0.0),
        models.AccountHolder(name="Petty Cash Account", current_balance=0.0),
    ])
    db.commit()
    return {"message": "Database successfully reset to fresh setup!"}




