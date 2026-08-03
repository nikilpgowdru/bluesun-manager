from sqlalchemy.orm import Session
import models
import crud
import schemas

def seed_db(db: Session):
    # Check if DB already seeded
    if db.query(models.BusinessUnit).first():
        return

    # 1. Create Business Units
    factories = ["Jeans", "Shirts", "Formals"]
    for f in factories:
        db.add(models.BusinessUnit(name=f))
    db.commit()

    # 2. Create Account Holders
    ah1 = models.AccountHolder(name="HDFC Corporate Account", current_balance=45000.0)
    ah2 = models.AccountHolder(name="ICICI Factory Fund", current_balance=28500.0)
    ah3 = models.AccountHolder(name="Petty Cash Account", current_balance=5000.0)
    db.add_all([ah1, ah2, ah3])
    db.commit()

    # 3. Create Demo Goods across factories
    goods_sample_data = [
        # Jeans
        {"factory": "Jeans", "type": "Slim Fit Denim", "brand": "Bluesun Urban Jeans", "date": "2026-06-10", "total": 1200, "rejected": 40},
        {"factory": "Jeans", "type": "Regular Fit Vintage", "brand": "Bluesun Classic Denim", "date": "2026-07-05", "total": 1500, "rejected": 50},
        {"factory": "Jeans", "type": "Skinny Stretch Jeans", "brand": "Bluesun NextGen", "date": "2026-08-01", "total": 800, "rejected": 20},
        # Shirts
        {"factory": "Shirts", "type": "Cotton Formal Shirt", "brand": "Bluesun Signature Shirts", "date": "2026-06-15", "total": 2000, "rejected": 60},
        {"factory": "Shirts", "type": "Linen Casual Shirt", "brand": "Bluesun Breeze", "date": "2026-07-12", "total": 1800, "rejected": 45},
        {"factory": "Shirts", "type": "Oxford Button-Down", "brand": "Bluesun Executive", "date": "2026-08-02", "total": 1100, "rejected": 30},
        # Formals
        {"factory": "Formals", "type": "Single Breasted Blazer", "brand": "Bluesun Royal Formals", "date": "2026-06-20", "total": 600, "rejected": 15},
        {"factory": "Formals", "type": "Formal Trousers Slim", "brand": "Bluesun Imperial Trousers", "date": "2026-07-18", "total": 1400, "rejected": 35},
        {"factory": "Formals", "type": "3-Piece Tuxedo Set", "brand": "Bluesun Elite Tailors", "date": "2026-07-28", "total": 400, "rejected": 10},
    ]

    created_goods = []
    for g in goods_sample_data:
        good = crud.create_goods(db, schemas.GoodsCreate(
            factory_name=g["factory"],
            type=g["type"],
            brand_name=g["brand"],
            manufacture_date=g["date"],
            total_pcs=g["total"],
            rejected_pcs=g["rejected"]
        ))
        created_goods.append(good)

    # 4. Create Initial Sales for some goods
    # Sale 1: Jeans - Saving to HDFC
    crud.create_sale(db, created_goods[0].id, schemas.SaleCreate(
        date="2026-06-18",
        sold_to="Apex Retailers Ltd",
        quantity=400,
        price=45.0,
        receipt="REC-2026-001",
        receiver="Saving",
        account_holder_id=ah1.id
    ))

    # Sale 2: Shirts - Expense
    crud.create_sale(db, created_goods[3].id, schemas.SaleCreate(
        date="2026-06-25",
        sold_to="Metro Style Hub",
        quantity=600,
        price=30.0,
        receipt="REC-2026-002",
        receiver="Expense",
        expense_description="Raw Cotton Material & Thread Supplies"
    ))

    # Sale 3: Formals - Saving to ICICI
    crud.create_sale(db, created_goods[6].id, schemas.SaleCreate(
        date="2026-07-02",
        sold_to="Vogue Menswear Inc",
        quantity=200,
        price=120.0,
        receipt="REC-2026-003",
        receiver="Saving",
        account_holder_id=ah2.id
    ))

    # Sale 4: Jeans - Saving to HDFC
    crud.create_sale(db, created_goods[1].id, schemas.SaleCreate(
        date="2026-07-15",
        sold_to="Global Apparel Wholesale",
        quantity=500,
        price=50.0,
        receipt="REC-2026-004",
        receiver="Saving",
        account_holder_id=ah1.id
    ))

    # Sale 5: Shirts - Expense
    crud.create_sale(db, created_goods[4].id, schemas.SaleCreate(
        date="2026-07-22",
        sold_to="Urban Fashion Outlet",
        quantity=400,
        price=35.0,
        receipt="REC-2026-005",
        receiver="Expense",
        expense_description="Factory Machinery Maintenance & Lubricants"
    ))

    # 5. Create Manual Expenses
    crud.create_manual_expense(db, schemas.ExpenseCreate(
        factory_name="Jeans",
        date="2026-07-10",
        expense_description="Denim Dyeing Chemicals & Water Treatment",
        amount=3200.0,
        account_holder_id=ah2.id
    ))

    crud.create_manual_expense(db, schemas.ExpenseCreate(
        factory_name="Formals",
        date="2026-07-25",
        expense_description="Custom Button & Zipper Ingestion Shipment",
        amount=1850.0,
        account_holder_id=ah3.id
    ))

    print("Demo database successfully seeded!")
