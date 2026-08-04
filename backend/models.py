from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class BusinessUnit(Base):
    __tablename__ = "business_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # Jeans, Shirts, Formals

class Goods(Base):
    __tablename__ = "goods"

    id = Column(Integer, primary_key=True, index=True)
    factory_name = Column(String, nullable=False, index=True) # Jeans, Shirts, Formals
    type = Column(String, nullable=False)
    brand_name = Column(String, nullable=False)
    manufacture_date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    total_pcs = Column(Integer, nullable=False, default=0)
    rejected_pcs = Column(Integer, nullable=False, default=0)
    sold_pcs = Column(Integer, nullable=False, default=0)
    total_earnings = Column(Float, nullable=False, default=0.0)

    sales = relationship("Sale", back_populates="goods", cascade="all, delete-orphan")

    @property
    def passed_pcs(self):
        return self.total_pcs - self.rejected_pcs

    @property
    def available_pcs(self):
        return self.passed_pcs - self.sold_pcs

class AccountHolder(Base):
    __tablename__ = "account_holders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    current_balance = Column(Float, nullable=False, default=0.0)

    sales = relationship("Sale", back_populates="account_holder")
    expenses = relationship("Expense", back_populates="account_holder")
    transactions = relationship("Transaction", back_populates="account_holder")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    goods_id = Column(Integer, ForeignKey("goods.id"), nullable=False)
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    sold_to = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False) # Unit price
    total_amount = Column(Float, nullable=False) # (quantity * price) + gst_amount
    gst_percent = Column(Float, nullable=False, default=0.0) # GST % e.g. 0, 5, 12, 18, 28
    gst_amount = Column(Float, nullable=False, default=0.0) # GST Cost ₹
    receipt = Column(String, nullable=False)
    receiver = Column(String, nullable=False) # "Expense" or "Saving"
    account_holder_id = Column(Integer, ForeignKey("account_holders.id"), nullable=True)
    expense_description = Column(String, nullable=True)

    goods = relationship("Goods", back_populates="sales")
    account_holder = relationship("AccountHolder", back_populates="sales")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    factory_name = Column(String, nullable=False, index=True) # Jeans, Shirts, Formals
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    expense_description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    account_holder_id = Column(Integer, ForeignKey("account_holders.id"), nullable=True)
    is_from_sale = Column(Boolean, nullable=False, default=False)

    account_holder = relationship("AccountHolder", back_populates="expenses")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    type = Column(String, nullable=False, index=True) # "Sale" or "Expense"
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    factory_name = Column(String, nullable=False, index=True) # Jeans, Shirts, Formals
    goods_id = Column(Integer, ForeignKey("goods.id"), nullable=True)
    sales_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)
    account_holder_id = Column(Integer, ForeignKey("account_holders.id"), nullable=True)

    account_holder = relationship("AccountHolder", back_populates="transactions")
