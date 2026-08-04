from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class BusinessUnitOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class GoodsCreate(BaseModel):
    factory_name: str # Jeans, Shirts, Formals
    type: str
    brand_name: str
    manufacture_date: str # YYYY-MM-DD
    total_pcs: int = Field(..., ge=1)
    rejected_pcs: int = Field(0, ge=0)

    @field_validator('factory_name')
    def validate_factory(cls, v):
        if v not in ['Jeans', 'Shirts', 'Formals']:
            raise ValueError('Factory name must be Jeans, Shirts, or Formals')
        return v

    @field_validator('rejected_pcs')
    def validate_rejected(cls, v, info):
        if 'total_pcs' in info.data and v > info.data['total_pcs']:
            raise ValueError('Rejected PCS cannot exceed Total PCS')
        return v

class GoodsOut(BaseModel):
    id: int
    factory_name: str
    type: str
    brand_name: str
    manufacture_date: str
    total_pcs: int
    rejected_pcs: int
    passed_pcs: int
    available_pcs: int
    sold_pcs: int
    total_earnings: float

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    date: str # YYYY-MM-DD
    sold_to: str
    quantity: int = Field(..., ge=1)
    price: float = Field(..., gt=0) # Unit price
    gst_percent: Optional[float] = 0.0
    gst_amount: Optional[float] = 0.0
    receipt: str
    receiver: str # "Expense" or "Saving"
    account_holder_id: Optional[int] = None
    expense_description: Optional[str] = None

    @field_validator('receiver')
    def validate_receiver(cls, v):
        if v not in ['Expense', 'Saving']:
            raise ValueError('Receiver must be Expense or Saving')
        return v

class SaleOut(BaseModel):
    id: int
    goods_id: int
    date: str
    sold_to: str
    quantity: int
    price: float
    gst_percent: float = 0.0
    gst_amount: float = 0.0
    total_amount: float
    receipt: str
    receiver: str
    account_holder_id: Optional[int] = None
    expense_description: Optional[str] = None
    account_holder_name: Optional[str] = None

    class Config:
        from_attributes = True

class AccountHolderCreate(BaseModel):
    name: str
    current_balance: float = 0.0

class AccountHolderAdjust(BaseModel):
    action: str # "Deposit" or "Withdraw"
    amount: float = Field(..., gt=0)
    description: str

    @field_validator('action')
    def validate_action(cls, v):
        if v not in ['Deposit', 'Withdraw']:
            raise ValueError('Action must be Deposit or Withdraw')
        return v

class AccountHolderOut(BaseModel):
    id: int
    name: str
    current_balance: float

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    factory_name: str # Jeans, Shirts, Formals
    date: str # YYYY-MM-DD
    expense_description: str
    amount: float = Field(..., gt=0)
    account_holder_id: int # Manual expense reduces selected Account Holder balance

    @field_validator('factory_name')
    def validate_factory(cls, v):
        if v not in ['Jeans', 'Shirts', 'Formals']:
            raise ValueError('Factory name must be Jeans, Shirts, or Formals')
        return v

class ExpenseOut(BaseModel):
    id: int
    factory_name: str
    date: str
    expense_description: str
    amount: float
    account_holder_id: Optional[int] = None
    is_from_sale: bool
    account_holder_name: Optional[str] = None

    class Config:
        from_attributes = True

class TransactionOut(BaseModel):
    id: int
    date: str
    type: str # "Sale" or "Expense"
    description: str
    amount: float
    factory_name: str
    goods_id: Optional[int] = None
    sales_id: Optional[int] = None
    expense_id: Optional[int] = None
    account_holder_id: Optional[int] = None
    account_holder_name: Optional[str] = None

    class Config:
        from_attributes = True

class FactorySummary(BaseModel):
    factory: str
    available_stock: int
    sales: float
    expenses: float
    profit: float

class Notification(BaseModel):
    id: str
    type: str # "warning", "info", "success"
    title: str
    message: str
    date: str

class DashboardStats(BaseModel):
    overall_available_stock: int
    total_sales: float
    total_expenses: float
    net_profit: float
    factory_summaries: List[FactorySummary]
    recent_goods: List[GoodsOut]
    notifications: List[Notification]

class GoodsDetailOut(BaseModel):
    goods: GoodsOut
    sales: List[SaleOut]

class AccountHistoryOut(BaseModel):
    account_holder: AccountHolderOut
    transactions: List[TransactionOut]

class ReportOut(BaseModel):
    month: str
    factory: str
    available_stock: int
    total_sales: float
    total_expenses: float
    net_profit: float
    factory_breakdown: List[FactorySummary]
    top_goods: List[GoodsOut]

# Update Models
class GoodsUpdate(BaseModel):
    factory_name: Optional[str] = None
    type: Optional[str] = None
    brand_name: Optional[str] = None
    manufacture_date: Optional[str] = None
    total_pcs: Optional[int] = Field(None, ge=1)
    rejected_pcs: Optional[int] = Field(None, ge=0)

class SaleUpdate(BaseModel):
    date: Optional[str] = None
    sold_to: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    price: Optional[float] = Field(None, gt=0)
    gst_percent: Optional[float] = None
    gst_amount: Optional[float] = None
    receipt: Optional[str] = None
    receiver: Optional[str] = None
    account_holder_id: Optional[int] = None
    expense_description: Optional[str] = None

class AccountHolderUpdate(BaseModel):
    name: Optional[str] = None
    current_balance: Optional[float] = None

class ExpenseUpdate(BaseModel):
    factory_name: Optional[str] = None
    date: Optional[str] = None
    expense_description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    account_holder_id: Optional[int] = None

