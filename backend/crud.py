from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
from fastapi import HTTPException

def goods_to_out(g: models.Goods) -> schemas.GoodsOut:
    return schemas.GoodsOut(
        id=g.id,
        batch_number=g.batch_number or "BATCH-DEFAULT",
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
def get_goods(db: Session, factory: str = None, month: str = None, batch: str = None):
    query = db.query(models.Goods)
    if factory and factory != "All":
        query = query.filter(models.Goods.factory_name == factory)
    if month and month != "All":
        query = query.filter(models.Goods.manufacture_date.startswith(month))
    if batch and batch != "All":
        query = query.filter(models.Goods.batch_number == batch)
    goods_list = query.order_by(models.Goods.manufacture_date.desc(), models.Goods.id.desc()).all()
    return [goods_to_out(g) for g in goods_list]

def create_goods(db: Session, goods_in: schemas.GoodsCreate):
    b_num = goods_in.batch_number if goods_in.batch_number and goods_in.batch_number.strip() else f"BATCH-{goods_in.manufacture_date.replace('-', '')[:6]}-{goods_in.factory_name[:3].upper()}"
    goods = models.Goods(
        batch_number=b_num,
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
            payment_status=getattr(s, 'payment_status', 'Paid') or 'Paid',
            paid_amount=getattr(s, 'paid_amount', s.total_amount) if getattr(s, 'paid_amount', None) is not None else s.total_amount,
            balance_due=getattr(s, 'balance_due', 0.0) or 0.0,
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
    
    # Calculate Payment Status & Balance
    p_status = sale_in.payment_status or "Paid"
    if p_status == "Paid":
        p_amount = total_amount
        b_due = 0.0
    elif p_status == "Pending":
        p_amount = 0.0
        b_due = total_amount
    else: # Partial
        p_amount = round(sale_in.paid_amount or 0.0, 2)
        b_due = round(max(0.0, total_amount - p_amount), 2)
        if b_due == 0.0:
            p_status = "Paid"

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
        payment_status=p_status,
        paid_amount=p_amount,
        balance_due=b_due,
        receipt=sale_in.receipt,
        receiver=sale_in.receiver,
        account_holder_id=sale_in.account_holder_id if sale_in.receiver == "Saving" else None,
        expense_description=sale_in.expense_description if sale_in.receiver == "Expense" else None
    )
    db.add(sale)
    db.flush()

    # 3. Create Transaction
    tx_status_text = f" ({p_status})" if p_status != "Paid" else ""
    transaction_desc = f"Sale: {goods.brand_name} ({goods.type}) x {sale_in.quantity} pcs to {sale_in.sold_to}{tx_status_text}"
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

    # 4. Receiver Logic (only apply actual cash received `p_amount` to Account Holder/Expense)
    if p_amount > 0:
        if sale_in.receiver == "Expense":
            exp_desc = sale_in.expense_description or f"Expense from Sale of {goods.brand_name}"
            expense = models.Expense(
                factory_name=goods.factory_name,
                date=sale_in.date,
                expense_description=exp_desc,
                amount=p_amount,
                account_holder_id=None,
                is_from_sale=True
            )
            db.add(expense)
        elif sale_in.receiver == "Saving":
            if sale_in.account_allocations and len(sale_in.account_allocations) > 0:
                for alloc in sale_in.account_allocations:
                    if alloc.amount > 0:
                        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == alloc.account_holder_id).first()
                        if ah:
                            ah.current_balance += alloc.amount
                            tx_desc = f"Sale Deposit ({ah.name}): {goods.brand_name} x {sale_in.quantity} pcs to {sale_in.sold_to}"
                            db.add(models.Transaction(
                                date=sale_in.date,
                                type="Sale",
                                description=tx_desc,
                                amount=alloc.amount,
                                factory_name=goods.factory_name,
                                goods_id=goods.id,
                                sales_id=sale.id,
                                account_holder_id=ah.id
                            ))
            elif sale_in.account_holder_id:
                account_holder = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale_in.account_holder_id).first()
                if account_holder:
                    account_holder.current_balance += p_amount

    db.commit()
    db.refresh(sale)
    return sale

def get_all_sales(db: Session, month: str = None):
    query = db.query(models.Sale)
    if month and month != "All":
        query = query.filter(models.Sale.date.startswith(month))
    sales = query.order_by(models.Sale.date.desc(), models.Sale.id.desc()).all()
    
    result = []
    for s in sales:
        g = db.query(models.Goods).filter(models.Goods.id == s.goods_id).first()
        ah_name = None
        if s.account_holder_id:
            ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == s.account_holder_id).first()
            if ah:
                ah_name = ah.name
        result.append(schemas.SaleOut(
            id=s.id,
            goods_id=s.goods_id,
            batch_number=s.batch_number or (g.batch_number if g else "BATCH-DEFAULT"),
            factory_name=g.factory_name if g else "Unknown",
            type=g.type if g else "Unknown",
            brand_name=g.brand_name if g else "Unknown",
            date=s.date,
            sold_to=s.sold_to,
            quantity=s.quantity,
            price=s.price,
            gst_percent=s.gst_percent,
            gst_amount=s.gst_amount,
            total_amount=s.total_amount,
            payment_status=s.payment_status,
            paid_amount=s.paid_amount,
            balance_due=s.balance_due,
            receipt=s.receipt,
            receiver=s.receiver,
            account_holder_id=s.account_holder_id,
            expense_description=s.expense_description,
            account_holder_name=ah_name
        ))
    return result

def get_sales_summary(db: Session, month: str = None):
    sales_query = db.query(models.Sale)
    chansandra_query = db.query(models.ChansandraEntry)
    if month and month != "All":
        sales_query = sales_query.filter(models.Sale.date.startswith(month))
        chansandra_query = chansandra_query.filter(models.ChansandraEntry.date.startswith(month))
        
    sales = sales_query.all()
    chansandra_entries = chansandra_query.all()
    
    overall_total = sum(s.total_amount for s in sales) + sum(c.amount for c in chansandra_entries)
    overall_units = sum(s.quantity for s in sales) + sum(c.quantity for c in chansandra_entries)
    overall_pending = sum(s.balance_due for s in sales)
    
    cat_data = {
        "Jeans": {"units_sold": 0, "total_revenue": 0.0},
        "Shirts": {"units_sold": 0, "total_revenue": 0.0},
        "Formals": {"units_sold": 0, "total_revenue": 0.0},
    }
    
    for s in sales:
        g = db.query(models.Goods).filter(models.Goods.id == s.goods_id).first()
        if g and g.factory_name in cat_data:
            cat_data[g.factory_name]["units_sold"] += s.quantity
            cat_data[g.factory_name]["total_revenue"] += s.total_amount
            
    for c in chansandra_entries:
        if c.factory_name in cat_data:
            cat_data[c.factory_name]["units_sold"] += c.quantity
            cat_data[c.factory_name]["total_revenue"] += c.amount
            
    return schemas.SalesSummaryOut(
        overall_total_sales=round(overall_total, 2),
        overall_units_sold=overall_units,
        overall_pending_balance=round(overall_pending, 2),
        jeans=schemas.GarmentCategorySummary(**cat_data["Jeans"]),
        shirts=schemas.GarmentCategorySummary(**cat_data["Shirts"]),
        formals=schemas.GarmentCategorySummary(**cat_data["Formals"])
    )

def create_multi_item_sale(db: Session, multi_in: schemas.MultiSaleCreate):
    created_sales = []
    
    items_subtotal = sum(it.quantity * it.price for it in multi_in.items)
    
    gst_pct = multi_in.gst_percent or 0.0
    if multi_in.gst_amount and multi_in.gst_amount > 0:
        total_gst = multi_in.gst_amount
    else:
        total_gst = (items_subtotal * gst_pct) / 100.0
        
    grand_total = items_subtotal + total_gst
    
    p_status = multi_in.payment_status or "Paid"
    if p_status == "Paid":
        p_amount = grand_total
        b_due = 0.0
    elif p_status == "Pending":
        p_amount = 0.0
        b_due = grand_total
    else:
        p_amount = multi_in.paid_amount or 0.0
        b_due = max(0.0, grand_total - p_amount)
        
    item_descriptions = []
    for item in multi_in.items:
        goods = db.query(models.Goods).filter(models.Goods.id == item.goods_id).first()
        if not goods:
            raise HTTPException(status_code=404, detail=f"Goods item ID {item.goods_id} not found")
        if item.quantity > goods.available_pcs:
            raise HTTPException(status_code=400, detail=f"Stock insufficient for {goods.brand_name} ({goods.type}). Requested {item.quantity}, available {goods.available_pcs}.")
            
        item_subtotal = item.quantity * item.price
        item_gst = (item_subtotal / items_subtotal) * total_gst if items_subtotal > 0 else 0.0
        item_total = item_subtotal + item_gst
        item_paid = (item_subtotal / items_subtotal) * p_amount if items_subtotal > 0 else 0.0
        item_due = item_total - item_paid
        
        goods.sold_pcs += item.quantity
        goods.total_earnings += item_total
        
        sale = models.Sale(
            goods_id=goods.id,
            batch_number=goods.batch_number or "BATCH-DEFAULT",
            date=multi_in.date,
            sold_to=multi_in.sold_to,
            quantity=item.quantity,
            price=item.price,
            gst_percent=gst_pct,
            gst_amount=round(item_gst, 2),
            total_amount=round(item_total, 2),
            payment_status=p_status,
            paid_amount=round(item_paid, 2),
            balance_due=round(item_due, 2),
            receipt=multi_in.receipt,
            receiver=multi_in.receiver,
            account_holder_id=multi_in.account_holder_id if multi_in.receiver == "Saving" else None,
            expense_description=multi_in.expense_description if multi_in.receiver == "Expense" else None
        )
        db.add(sale)
        db.flush()
        created_sales.append(sale)
        item_descriptions.append(f"{goods.brand_name} ({goods.factory_name}) x {item.quantity} pcs")

    tx_status = f" ({p_status})" if p_status != "Paid" else ""
    tx_desc = f"Multi-Sale ({', '.join(item_descriptions)}) to {multi_in.sold_to}{tx_status}"
    tx = models.Transaction(
        date=multi_in.date,
        type="Sale",
        description=tx_desc,
        amount=round(grand_total, 2),
        factory_name="Multi",
        sales_id=created_sales[0].id if created_sales else None,
        account_holder_id=multi_in.account_holder_id if multi_in.receiver == "Saving" else None
    )
    db.add(tx)
    
    if p_amount > 0:
        if multi_in.receiver == "Expense":
            exp_desc = multi_in.expense_description or f"Expense from Multi-Sale"
            db.add(models.Expense(
                factory_name="Multi",
                date=multi_in.date,
                expense_description=exp_desc,
                amount=p_amount,
                account_holder_id=None,
                is_from_sale=True
            ))
        elif multi_in.receiver == "Saving":
            if multi_in.account_allocations and len(multi_in.account_allocations) > 0:
                for alloc in multi_in.account_allocations:
                    if alloc.amount > 0:
                        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == alloc.account_holder_id).first()
                        if ah:
                            ah.current_balance += alloc.amount
            elif multi_in.account_holder_id:
                ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == multi_in.account_holder_id).first()
                if ah:
                    ah.current_balance += p_amount

    db.commit()
    return [schemas.SaleOut.model_validate(s) for s in created_sales]

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

    # ALWAYS sorted by Date in descending order (most recent transactions first)
    transactions = query.order_by(models.Transaction.date.desc(), models.Transaction.id.desc()).all()
    
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

def adjust_account_holder_balance(db: Session, account_holder_id: int, adjust_in: schemas.AccountHolderAdjust):
    import datetime
    ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == account_holder_id).first()
    if not ah:
        raise HTTPException(status_code=404, detail="Account Holder not found")
    
    amount = round(adjust_in.amount, 2)
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    if adjust_in.action == "Deposit":
        ah.current_balance += amount
        tx_type = "Sale"
        tx_desc = f"Manual Deposit: {adjust_in.description} (+₹{amount})"
    else: # Withdraw
        ah.current_balance -= amount
        tx_type = "Expense"
        tx_desc = f"Manual Withdrawal: {adjust_in.description} (-₹{amount})"
    
    tx = models.Transaction(
        date=today_str,
        type=tx_type,
        description=tx_desc,
        amount=amount,
        factory_name="Jeans",
        account_holder_id=ah.id
    )
    db.add(tx)
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
    overall_rejected_pcs = sum(g.rejected_pcs for g in all_goods)

    try:
        chansandra_entries = db.query(models.ChansandraEntry).all()
        chansandra_total = sum(c.amount for c in chansandra_entries)
    except Exception:
        chansandra_total = 0.0

    total_sales_goods = sum(s.total_amount for s in all_sales)
    total_sales = round(total_sales_goods + chansandra_total, 2)
    total_expenses = sum(e.amount for e in all_expenses)
    net_profit = round(total_sales - total_expenses, 2)

    # Calculate Factory Summaries for the 3 factories
    factories = ["Jeans", "Shirts", "Formals"]
    factory_summaries = []

    for f in factories:
        f_goods = [g for g in all_goods if g.factory_name == f]
        f_sales = [s for s in all_sales if s.goods and s.goods.factory_name == f]
        f_expenses = [e for e in all_expenses if e.factory_name == f]
        f_chansandra = [c for c in chansandra_entries if c.factory_name == f] if chansandra_total > 0 else []

        f_stock = sum(g.available_pcs for g in f_goods)
        f_sales_amount = sum(s.total_amount for s in f_sales) + sum(c.amount for c in f_chansandra)
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
        overall_rejected_pcs=overall_rejected_pcs,
        total_sales=total_sales,
        total_expenses=total_expenses,
        net_profit=net_profit,
        chansandra_total=chansandra_total,
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
    
    old_p_amount = getattr(sale, 'paid_amount', sale.total_amount) if getattr(sale, 'paid_amount', None) is not None else sale.total_amount

    if sale.receiver == "Saving" and sale.account_holder_id:
        ah_old = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah_old:
            ah_old.current_balance = max(0.0, ah_old.current_balance - old_p_amount)
    elif sale.receiver == "Expense":
        db.query(models.Expense).filter(
            models.Expense.factory_name == goods.factory_name,
            models.Expense.date == sale.date,
            models.Expense.amount == old_p_amount,
            models.Expense.is_from_sale == True
        ).delete()

    # Update attributes
    new_qty = sale_in.quantity if sale_in.quantity is not None else sale.quantity
    new_price = sale_in.price if sale_in.price is not None else sale.price
    
    if new_qty > goods.available_pcs:
        raise HTTPException(status_code=400, detail=f"Requested quantity ({new_qty}) exceeds available stock ({goods.available_pcs})")

    subtotal = round(new_qty * new_price, 2)
    gst_pct = sale_in.gst_percent if sale_in.gst_percent is not None else sale.gst_percent
    if sale_in.gst_amount is not None and sale_in.gst_amount > 0:
        gst_amt = round(sale_in.gst_amount, 2)
    else:
        gst_amt = round(subtotal * ((gst_pct or 0.0) / 100.0), 2)

    new_total = round(subtotal + gst_amt, 2)

    # Calculate payment status & paid amount
    new_p_status = sale_in.payment_status or sale.payment_status or "Paid"
    if new_p_status == "Paid":
        new_p_amount = new_total
        new_b_due = 0.0
    elif new_p_status == "Pending":
        new_p_amount = 0.0
        new_b_due = new_total
    else: # Partial
        new_p_amount = round(sale_in.paid_amount if sale_in.paid_amount is not None else sale.paid_amount, 2)
        new_b_due = round(max(0.0, new_total - new_p_amount), 2)
        if new_b_due == 0.0:
            new_p_status = "Paid"

    sale.date = sale_in.date or sale.date
    sale.sold_to = sale_in.sold_to or sale.sold_to
    sale.quantity = new_qty
    sale.price = new_price
    sale.gst_percent = gst_pct
    sale.gst_amount = gst_amt
    sale.total_amount = new_total
    sale.payment_status = new_p_status
    sale.paid_amount = new_p_amount
    sale.balance_due = new_b_due
    sale.receipt = sale_in.receipt or sale.receipt
    sale.receiver = sale_in.receiver or sale.receiver
    sale.account_holder_id = sale_in.account_holder_id if sale.receiver == "Saving" else None
    sale.expense_description = sale_in.expense_description if sale.receiver == "Expense" else None

    # Apply new sale impacts
    goods.sold_pcs += new_qty
    goods.total_earnings += new_total

    # Re-create transaction
    db.query(models.Transaction).filter(models.Transaction.sales_id == sale.id).delete()
    tx_status_text = f" ({new_p_status})" if new_p_status != "Paid" else ""
    tx_desc = f"Sale: {goods.brand_name} ({goods.type}) x {new_qty} pcs to {sale.sold_to}{tx_status_text}"
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

    # ONLY apply actual transferred cash `new_p_amount` to Account Holders / Expense
    if new_p_amount > 0:
        if sale.receiver == "Expense":
            exp_desc = sale.expense_description or f"Expense from Sale of {goods.brand_name}"
            db.add(models.Expense(
                factory_name=goods.factory_name,
                date=sale.date,
                expense_description=exp_desc,
                amount=new_p_amount,
                account_holder_id=None,
                is_from_sale=True
            ))
        elif sale.receiver == "Saving":
            if sale_in.account_allocations and len(sale_in.account_allocations) > 0:
                for alloc in sale_in.account_allocations:
                    if alloc.amount > 0:
                        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == alloc.account_holder_id).first()
                        if ah:
                            ah.current_balance += alloc.amount
            elif sale.account_holder_id:
                ah_new = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
                if ah_new:
                    ah_new.current_balance += new_p_amount

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

    old_p_amount = getattr(sale, 'paid_amount', sale.total_amount) if getattr(sale, 'paid_amount', None) is not None else sale.total_amount

    if sale.receiver == "Saving" and sale.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == sale.account_holder_id).first()
        if ah:
            ah.current_balance = max(0.0, ah.current_balance - old_p_amount)
    elif sale.receiver == "Expense":
        db.query(models.Expense).filter(
            models.Expense.factory_name == (goods.factory_name if goods else "Jeans"),
            models.Expense.date == sale.date,
            models.Expense.amount == old_p_amount,
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

# Pending Balances (Pay Later)
def get_pending_balances(db: Session):
    try:
        sales = db.query(models.Sale).filter(
            (models.Sale.balance_due > 0) | (models.Sale.payment_status != "Paid")
        ).order_by(models.Sale.date.desc()).all()
    except Exception as err:
        db.rollback()
        print("Safely handling pending balances query:", err)
        sales = []
    
    result = []
    for s in sales:
        g = db.query(models.Goods).filter(models.Goods.id == s.goods_id).first()
        result.append(schemas.PendingBalanceOut(
            sale_id=s.id,
            goods_id=s.goods_id,
            factory_name=g.factory_name if g else "Jeans",
            type=g.type if g else "",
            brand_name=g.brand_name if g else "",
            sold_to=s.sold_to,
            date=s.date,
            quantity=s.quantity,
            price=s.price,
            total_amount=s.total_amount,
            paid_amount=getattr(s, 'paid_amount', s.total_amount) if getattr(s, 'paid_amount', None) is not None else s.total_amount,
            balance_due=getattr(s, 'balance_due', 0.0) or 0.0,
            payment_status=getattr(s, 'payment_status', 'Pending') or 'Pending',
            receipt=s.receipt
        ))
    return result

def settle_sale_balance(db: Session, sale_id: int, settle_in: schemas.SettleBalanceIn):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")
    
    pay_amt = round(settle_in.amount_paid, 2)
    if pay_amt <= 0:
        raise HTTPException(status_code=400, detail="Amount paid must be greater than 0")
    
    current_due = getattr(sale, 'balance_due', 0.0) or 0.0
    if pay_amt > current_due:
        pay_amt = current_due
        
    sale.paid_amount = (getattr(sale, 'paid_amount', 0.0) or 0.0) + pay_amt
    sale.balance_due = max(0.0, current_due - pay_amt)
    
    if sale.balance_due == 0:
        sale.payment_status = "Paid"
    else:
        sale.payment_status = "Partial"
        
    if settle_in.account_holder_id:
        ah = db.query(models.AccountHolder).filter(models.AccountHolder.id == settle_in.account_holder_id).first()
        if ah:
            ah.current_balance += pay_amt
            g = db.query(models.Goods).filter(models.Goods.id == sale.goods_id).first()
            brand = g.brand_name if g else "Goods"
            tx = models.Transaction(
                date=sale.date,
                type="Sale",
                description=f"Balance Payment Collected from {sale.sold_to} for {brand} (+₹{pay_amt})",
                amount=pay_amt,
                factory_name=g.factory_name if g else "Jeans",
                goods_id=sale.goods_id,
                sales_id=sale.id,
                account_holder_id=ah.id
            )
            db.add(tx)

    db.commit()
    db.refresh(sale)
    return sale

# Chansandra Loan Payback Section
def create_chansandra_entry(db: Session, entry_in: schemas.ChansandraEntryCreate):
    entry = models.ChansandraEntry(
        factory_name=entry_in.factory_name,
        brand_name=entry_in.brand_name,
        type=entry_in.type,
        date=entry_in.date,
        quantity=entry_in.quantity,
        amount=entry_in.amount,
        notes=entry_in.notes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_chansandra_summary(db: Session, month: str = None):
    try:
        query = db.query(models.ChansandraEntry)
        if month and month != "All":
            query = query.filter(models.ChansandraEntry.date.startswith(month))
        entries = query.order_by(models.ChansandraEntry.date.desc()).all()
    except Exception as err:
        db.rollback()
        print("Safely handling chansandra entries query:", err)
        entries = []
    
    shirts = [e for e in entries if e.factory_name == "Shirts"]
    formals = [e for e in entries if e.factory_name == "Formals"]
    jeans = [e for e in entries if e.factory_name == "Jeans"]
    
    shirts_pcs = sum(e.quantity for e in shirts)
    shirts_amt = sum(e.amount for e in shirts)
    formals_pcs = sum(e.quantity for e in formals)
    formals_amt = sum(e.amount for e in formals)
    jeans_pcs = sum(e.quantity for e in jeans)
    jeans_amt = sum(e.amount for e in jeans)
    
    total_amount = sum(e.amount for e in entries)
    total_pcs = sum(e.quantity for e in entries)
    
    entries_out = [schemas.ChansandraEntryOut.model_validate(e) for e in entries]
    
    return schemas.ChansandraSummary(
        total_amount=total_amount,
        total_pcs=total_pcs,
        shirts_pcs=shirts_pcs,
        shirts_amount=shirts_amt,
        formals_pcs=formals_pcs,
        formals_amount=formals_amt,
        jeans_pcs=jeans_pcs,
        jeans_amount=jeans_amt,
        entries=entries_out
    )

def delete_chansandra_entry(db: Session, entry_id: int):
    entry = db.query(models.ChansandraEntry).filter(models.ChansandraEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Chansandra entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Chansandra entry deleted successfully"}




