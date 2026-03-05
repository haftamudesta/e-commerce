from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
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
from app.models.users import User
from app.database.database import get_db
from app.api.users import get_current_user, require_roles
import logging
import json

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSession,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Create a Stripe checkout session for one-time payment
    Requires authentication
    """
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
            "client_reference_id": str(current_user.id),  
            "metadata": {
                "user_id": str(current_user.id),
                "username": current_user.username,
                **(request.metadata or {})
            }
        }
        
        session_params["customer_email"] = current_user.email
        
        if request.subscription_data and request.mode == "subscription":
            session_params["subscription_data"] = request.subscription_data

        session = stripe.checkout.Session.create(**session_params)

        logger.info(f"Checkout session created for user {current_user.id}: {session.id}")

        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url,
            publishable_key=STRIPE_PUBLISHABLE_KEY
        )
    except Exception as e:
        logger.error(f"Error creating checkout session for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-subscription", response_model=SubscriptionResponse)
async def create_subscription(
    request: SubscriptionCreate,
    current_user: User = Depends(get_current_user),  
    db: AsyncSession = Depends(get_db)
):
    """
    Create a subscription
    Requires authentication
    """
    try:
        if current_user.stripe_customer_id:
            customer_id = current_user.stripe_customer_id
            logger.info(f"Using existing customer {customer_id} for user {current_user.id}")
        else:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.username,
                metadata={
                    "user_id": str(current_user.id),
                    "username": current_user.username
                }
            )
            customer_id = customer.id
            
            stmt = update(User).where(User.id == current_user.id).values(
                stripe_customer_id=customer_id
            )
            await db.execute(stmt)
            await db.commit()
            logger.info(f"Created new customer {customer_id} for user {current_user.id}")
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": request.price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
            metadata={
                "user_id": str(current_user.id),
                "username": current_user.username
            }
        )

        logger.info(f"Subscription created for user {current_user.id}: {subscription.id}")

        return SubscriptionResponse(
            subscription_id=subscription.id,
            client_secret=subscription.latest_invoice.payment_intent.client_secret,
            status=subscription.status
        )
    except Exception as e:
        logger.error(f"Error creating subscription for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/session-status/{session_id}", response_model=CheckoutSessionStatus)
async def get_session_status(
    session_id: str,
    current_user: User = Depends(get_current_user)  
):
    """
    Get checkout session status
    Requires authentication
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.metadata and session.metadata.get("user_id") != str(current_user.id):
            if session.client_reference_id != str(current_user.id):
                logger.warning(f"User {current_user.id} attempted to access session {session_id} belonging to another user")
                raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
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
        logger.error(f"Error getting session status for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-portal-session", response_model=PortalSessionResponse)
async def create_portal_session(
    request: PortalSessionCreate,
    current_user: User = Depends(get_current_user),  
    db: AsyncSession = Depends(get_db)
):
    """
    Create a Stripe customer portal session for subscription management
    Requires authentication
    """
    try:
        if not current_user.stripe_customer_id:
            raise HTTPException(status_code=400, detail="No Stripe customer found for this user")
        
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=request.return_url or f"{BASE_URL}/stripe/account",
            configuration={
                "business_profile": {
                    "headline": "Manage your subscription"
                },
                "features": {
                    "subscription_cancel": {"enabled": True},
                    "subscription_pause": {"enabled": True},
                    "payment_method_update": {"enabled": True},
                    "invoice_history": {"enabled": True}
                }
            }
        )
        
        logger.info(f"Portal session created for user {current_user.id}")
        
        return PortalSessionResponse(url=session.url)
    except Exception as e:
        logger.error(f"Error creating portal session for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),  
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's subscription status
    Requires authentication
    """
    try:
        if current_user.stripe_customer_id:
            try:
                subscriptions = stripe.Subscription.list(
                    customer=current_user.stripe_customer_id,
                    limit=10,
                    status="all"
                )
                
                if subscriptions.data:
                    subscription = subscriptions.data[0]
                    is_active = subscription.status in ["active", "trialing"]
                    
                    update_data = {
                        "is_subscribed": is_active,
                        "subscription_id": subscription.id,
                        "subscription_end_date": datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else None
                    }
                    
                    stmt = update(User).where(User.id == current_user.id).values(**update_data)
                    await db.execute(stmt)
                    await db.commit()
                    
                    logger.info(f"Updated subscription status for user {current_user.id}: {subscription.status}")
                    
                    return SubscriptionStatusResponse(
                        is_subscribed=is_active,
                        is_active=subscription.status == "active",
                        subscription_id=subscription.id,
                        subscription_end_date=str(subscription.current_period_end) if subscription.current_period_end else None,
                        stripe_customer_id=current_user.stripe_customer_id
                    )
            except Exception as e:
                logger.error(f"Error fetching from Stripe for user {current_user.id}: {str(e)}")
        
        return SubscriptionStatusResponse(
            is_subscribed=current_user.is_subscribed or False,
            is_active=current_user.is_subscribed or False,
            subscription_id=current_user.subscription_id,
            subscription_end_date=str(current_user.subscription_end_date.timestamp()) if current_user.subscription_end_date else None,
            stripe_customer_id=current_user.stripe_customer_id
        )
    except Exception as e:
        logger.error(f"Error getting subscription status for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Stripe webhooks
    No authentication required - this is called by Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"📨 Webhook received: {event['type']}")
    except ValueError:
        logger.error("Invalid payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_completed(session, db)
    
    elif event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        await handle_subscription_created(subscription, db)
    
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        await handle_subscription_updated(subscription, db)
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_cancelled(subscription, db)
    
    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        await handle_invoice_payment_succeeded(invoice, db)
    
    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        await handle_invoice_payment_failed(invoice, db)
    
    elif event["type"] == "customer.subscription.trial_will_end":
        subscription = event["data"]["object"]
        await handle_trial_ending(subscription, db)

    return WebhookResponse(status="success")

async def handle_checkout_completed(session, db: AsyncSession):
    """Handle successful checkout (both one-time and subscription)"""
    logger.info(f"✅ Checkout completed for session: {session.id}")
    
    user_id = None
    if session.metadata and session.metadata.get("user_id"):
        user_id = int(session.metadata["user_id"])
    elif session.client_reference_id:
        user_id = int(session.client_reference_id)
    
    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user:
            logger.info(f"Found user {user.id} for session {session.id}")
            
            if session.customer and not user.stripe_customer_id:
                stmt = update(User).where(User.id == user.id).values(
                    stripe_customer_id=session.customer
                )
                await db.execute(stmt)
                await db.commit()
                logger.info(f"Updated user {user.id} with Stripe customer ID: {session.customer}")
    
    if session.mode == "subscription":
        logger.info(f"🎉 Subscription created via checkout: {session.subscription}")
    else:
        logger.info(f"💰 One-time payment completed: ${session.amount_total/100 if session.amount_total else 0}")

async def handle_subscription_created(subscription, db: AsyncSession):
    """Handle new subscription creation"""
    logger.info(f"🆕 Subscription created: {subscription.id}")
    logger.info(f"Customer: {subscription.customer}")
    logger.info(f"Status: {subscription.status}")
    
    result = await db.execute(select(User).where(User.stripe_customer_id == subscription.customer))
    user = result.scalar_one_or_none()
    
    if user:
        logger.info(f"Found user {user.id} for subscription {subscription.id}")
        
        stmt = update(User).where(User.id == user.id).values(
            is_subscribed=True,
            subscription_id=subscription.id,
            subscription_end_date=datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else None
        )
        await db.execute(stmt)
        await db.commit()
        
        logger.info(f"✅ Updated user {user.id} with subscription {subscription.id}")
    else:
        logger.warning(f"No user found with Stripe customer ID: {subscription.customer}")

async def handle_subscription_updated(subscription, db: AsyncSession):
    """Handle subscription updates"""
    logger.info(f"📝 Subscription updated: {subscription.id}")
    logger.info(f"Status: {subscription.status}")
    
    result = await db.execute(
        select(User).where(
            (User.subscription_id == subscription.id) | 
            (User.stripe_customer_id == subscription.customer)
        )
    )
    user = result.scalar_one_or_none()
    
    if user:
        is_active = subscription.status in ["active", "trialing"]
        
        stmt = update(User).where(User.id == user.id).values(
            is_subscribed=is_active,
            subscription_end_date=datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else None
        )
        await db.execute(stmt)
        await db.commit()
        
        logger.info(f"✅ Updated user {user.id} subscription status to {subscription.status}")
        
        if subscription.cancel_at_period_end:
            logger.info(f"⏰ Subscription will cancel at period end: {subscription.id}")
        
        if subscription.status == "past_due":
            logger.warning(f"⚠️ Subscription past due for user {user.id}")
    else:
        logger.warning(f"No user found for subscription {subscription.id}")

async def handle_subscription_cancelled(subscription, db: AsyncSession):
    """Handle subscription cancellation"""
    logger.info(f"🗑️ Subscription cancelled: {subscription.id}")
    
    result = await db.execute(
        select(User).where(
            (User.subscription_id == subscription.id) | 
            (User.stripe_customer_id == subscription.customer)
        )
    )
    user = result.scalar_one_or_none()
    
    if user:
        stmt = update(User).where(User.id == user.id).values(
            is_subscribed=False,
            subscription_id=None,
            subscription_end_date=None
        )
        await db.execute(stmt)
        await db.commit()
        
        logger.info(f"✅ Updated user {user.id}: subscription cancelled")
    else:
        logger.warning(f"No user found for cancelled subscription {subscription.id}")

async def handle_invoice_payment_succeeded(invoice, db: AsyncSession):
    """Handle successful invoice payment"""
    logger.info(f"💰 Payment succeeded for invoice: {invoice.id}")
    logger.info(f"Amount: ${invoice.amount_paid/100 if invoice.amount_paid else 0}")
    
    if invoice.subscription:
        result = await db.execute(select(User).where(User.subscription_id == invoice.subscription))
        user = result.scalar_one_or_none()
        
        if user:
            logger.info(f"✅ Payment succeeded for user {user.id}")

async def handle_invoice_payment_failed(invoice, db: AsyncSession):
    """Handle failed invoice payment"""
    logger.warning(f"❌ Payment failed for invoice: {invoice.id}")
    logger.warning(f"Attempt count: {invoice.attempt_count}")
    
    if invoice.subscription:
        result = await db.execute(select(User).where(User.subscription_id == invoice.subscription))
        user = result.scalar_one_or_none()
        
        if user:
            logger.warning(f"⚠️ Payment failed for user {user.id}")

async def handle_trial_ending(subscription, db: AsyncSession):
    """Handle trial period ending soon"""
    logger.info(f"⏳ Trial ending for subscription: {subscription.id}")
    
    result = await db.execute(select(User).where(User.subscription_id == subscription.id))
    user = result.scalar_one_or_none()
    
    if user:
        logger.info(f"Trial ending soon for user {user.id}")

@router.get("/admin/users-with-subscriptions", dependencies=[Depends(require_roles(["admin"]))])
async def get_users_with_subscriptions(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all users with subscription information (admin only)
    """
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_subscribed": user.is_subscribed,
            "stripe_customer_id": user.stripe_customer_id,
            "subscription_id": user.subscription_id,
            "subscription_end_date": user.subscription_end_date
        }
        for user in users
    ]

@router.post("/admin/sync-subscriptions", dependencies=[Depends(require_roles(["admin"]))])
async def sync_all_subscriptions(
    db: AsyncSession = Depends(get_db)
):
    """
    Sync all user subscriptions with Stripe (admin only)
    """
    result = await db.execute(select(User).where(User.stripe_customer_id.isnot(None)))
    users = result.scalars().all()
    
    synced_count = 0
    errors = []
    
    for user in users:
        try:
            subscriptions = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                limit=1,
                status="all"
            )
            
            if subscriptions.data:
                subscription = subscriptions.data[0]
                is_active = subscription.status in ["active", "trialing"]
                
                stmt = update(User).where(User.id == user.id).values(
                    is_subscribed=is_active,
                    subscription_id=subscription.id,
                    subscription_end_date=datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else None
                )
                await db.execute(stmt)
                synced_count += 1
            else:
                stmt = update(User).where(User.id == user.id).values(
                    is_subscribed=False,
                    subscription_id=None,
                    subscription_end_date=None
                )
                await db.execute(stmt)
                synced_count += 1
                
        except Exception as e:
            errors.append({"user_id": user.id, "error": str(e)})
    
    await db.commit()
    
    return {
        "message": f"Synced {synced_count} users",
        "errors": errors
    }

@router.get("/customers/search")
async def search_customer(
    email: str,
    current_user: User = Depends(require_roles(["admin"])) 
):
    """
    Search for a Stripe customer by email (admin only)
    """
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return {"customer_id": customers.data[0].id}
        return {"customer_id": None}
    except Exception as e:
        logger.error(f"Error searching customer: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/customers")
async def create_customer(
    email: str,
    name: str = None,
    current_user: User = Depends(require_roles(["admin"]))  # Admin only
):
    """
    Create a Stripe customer (admin only)
    """
    try:
        customer = stripe.Customer.create(
            email=email,
            name=name
        )
        logger.info(f"Created new customer: {customer.id} for email: {email}")
        return {"customer_id": customer.id}
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))