from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
import stripe
from app.config import STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, BASE_URL
from app.schemas.stripe import (
    CreateCheckoutSession,
    CheckoutSessionResponse,
    CheckoutSessionStatus,
    SubscriptionCreate,
    SubscriptionResponse,
    PortalSessionCreate,
    PortalSessionResponse,
    SubscriptionStatusResponse,
    WebhookResponse
)
import logging

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(request: CreateCheckoutSession):
    try:
        line_items = []
        for item in request.items:
            line_items.append({
                "price_data": {
                    "currency": item.currency,
                    "product_data": {
                        "name": item.name,
                        "description": item.description,
                        "images": [item.image] if item.image else [],
                    },
                    "unit_amount": int(item.price * 100), 
                },
                "quantity": item.quantity,
            })

        session_params = {
            "line_items": line_items,
            "mode": request.mode,
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "payment_method_types": ["card"],
        }
        if request.customer_email:
            session_params["customer_email"] = request.customer_email
        if request.client_reference_id:
            session_params["client_reference_id"] = request.client_reference_id
        if request.metadata:
            session_params["metadata"] = request.metadata
        if request.subscription_data and request.mode == "subscription":
            session_params["subscription_data"] = request.subscription_data

        session = stripe.checkout.Session.create(**session_params)

        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url,
            publishable_key=STRIPE_PUBLISHABLE_KEY
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-subscription", response_model=SubscriptionResponse)
async def create_subscription(request: SubscriptionCreate):
    try:
        customers = stripe.Customer.list(email=request.customer_email, limit=1)
        if customers.data:
            customer = customers.data[0]
        else:
            customer = stripe.Customer.create(email=request.customer_email)

        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": request.price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
        )

        return SubscriptionResponse(
            subscription_id=subscription.id,
            client_secret=subscription.latest_invoice.payment_intent.client_secret,
            status=subscription.status
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/session-status/{session_id}", response_model=CheckoutSessionStatus)
async def get_session_status(session_id: str):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        return CheckoutSessionStatus(
            session_id=session.id,
            status=session.status,
            customer_email=session.customer_details.email if session.customer_details else None,
            amount_total=session.amount_total,
            payment_status=session.payment_status,
            mode=session.mode,
            subscription=session.subscription
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-portal-session", response_model=PortalSessionResponse)
async def create_portal_session(request: PortalSessionCreate, customer_id: str):
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=request.return_url or f"{BASE_URL}/account",
        )
        return PortalSessionResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscription-status/{customer_id}", response_model=SubscriptionStatusResponse)
async def get_subscription_status(customer_id: str):
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status="active",
            limit=1
        )
        
        if subscriptions.data:
            subscription = subscriptions.data[0]
            return SubscriptionStatusResponse(
                is_subscribed=True,
                is_active=subscription.status == "active",
                subscription_id=subscription.id,
                subscription_end_date=str(subscription.current_period_end),
                stripe_customer_id=customer_id
            )
        
        return SubscriptionStatusResponse(
            is_subscribed=False,
            is_active=False,
            stripe_customer_id=customer_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook", response_model=WebhookResponse)
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_completed(session)
    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        await handle_invoice_payment_succeeded(invoice)
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_cancelled(subscription)

    return WebhookResponse(status="success")

async def handle_checkout_completed(session):
    logging.info(f"Checkout completed for session: {session.id}")
    logging.info(f"Customer email: {session.customer_details.email}")
    
    if session.mode == "subscription":
        logging.info(f"Subscription created: {session.subscription}")
    else:
        logging.info(f"Payment completed: {session.amount_total}")

async def handle_invoice_payment_succeeded(invoice):
    logging.info(f"Payment succeeded for invoice: {invoice.id}")
    logging.info(f"Customer: {invoice.customer}")

async def handle_subscription_cancelled(subscription):
    logging.info(f"Subscription cancelled: {subscription.id}")
    logging.info(f"Customer: {subscription.customer}")

@router.get("/customers/search")
async def search_customer(email: str):
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return {"customer_id": customers.data[0].id}
        return {"customer_id": None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/customers")
async def create_customer(email: str, name: str = None):
    try:
        customer = stripe.Customer.create(
            email=email,
            name=name
        )
        return {"customer_id": customer.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))