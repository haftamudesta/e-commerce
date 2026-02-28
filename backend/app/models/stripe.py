from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CheckoutItem(BaseModel):
    name: str
    description: Optional[str] = None
    price: float  
    quantity: int
    image: Optional[str] = None
    currency: str = "usd"

class CreateCheckoutSession(BaseModel):
    items: List[CheckoutItem]
    success_url: str
    cancel_url: str
    customer_email: Optional[str] = None
    client_reference_id: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None
    
    mode: str = "payment"  
    subscription_data: Optional[Dict[str, Any]] = None 

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str
    publishable_key: str

class CheckoutSessionStatus(BaseModel):
    session_id: str
    status: str
    customer_email: Optional[str]
    amount_total: Optional[int]
    payment_status: str

class SubscriptionCreate(BaseModel):
    price_id: str  
    customer_email: str
    success_url: str
    cancel_url: str

class SubscriptionResponse(BaseModel):
    subscription_id: str
    client_secret: str
    status: str