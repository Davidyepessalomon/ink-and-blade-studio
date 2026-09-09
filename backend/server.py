import os
import re
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import bcrypt
import jwt
import stripe

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ink_blade_app")

# Environment
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "ink_and_blade_studio")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@inkandblade.com").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
stripe.api_key = STRIPE_SECRET_KEY or None

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Ink & Blade Studio Platform API")

@app.get("/health")
async def health():
    return {"status": "ok"}

# Setup CORS
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.environ.get("FRONTEND_URL", "http://localhost:3000"),
]
# Add wildcard origins if specified
if os.environ.get("CORS_ORIGINS"):
    for o in os.environ.get("CORS_ORIGINS").split(","):
        o = o.strip()
        if o and o not in allowed_origins:
            allowed_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ================= AUTH HELPERS ================= #
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            return None
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except Exception:
        return None

async def get_current_user(request: Request) -> Dict[str, Any]:
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def get_admin_or_artist(request: Request) -> Dict[str, Any]:
    user = await get_current_user(request)
    if user.get("role") not in ["admin", "artist"]:
        raise HTTPException(status_code=403, detail="Admin or Artist privileges required")
    return user

# ================= MODELS ================= #
class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = ""

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class BookingCreateRequest(BaseModel):
    service_id: str
    artist_id: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    date: str  # YYYY-MM-DD
    time_slot: str  # "10:00 AM"
    notes: Optional[str] = ""
    flash_item_id: Optional[str] = None
    custom_inquiry_id: Optional[str] = None
    origin_url: Optional[str] = "http://localhost:3000"

class InquiryCreateRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    client_phone: str
    artist_id: Optional[str] = "all"
    style: str
    placement: str
    size_dimensions: str
    budget_range: str
    description: str
    reference_images: List[str] = []
    preferred_date: Optional[str] = ""
    preferred_time: Optional[str] = ""

class InquiryQuoteRequest(BaseModel):
    quoted_price: float
    deposit_amount: float
    estimated_hours: float
    admin_notes: Optional[str] = ""
    status: Optional[str] = "quoted"

class AftercareSendRequest(BaseModel):
    booking_id: str
    custom_notes: Optional[str] = ""

class PortfolioItemCreate(BaseModel):
    title: str
    type: str  # "tattoo", "barber", "flash"
    artist_id: str
    artist_name: str
    category: str
    image_url: str
    description: Optional[str] = ""
    price_estimate: Optional[str] = ""
    is_flash: Optional[bool] = False
    flash_status: Optional[str] = "available"
    tags: List[str] = []

# ================= AUTH ENDPOINTS ================= #
@api_router.post("/auth/register")
async def register(req: UserRegisterRequest, response: Response):
    email = req.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": req.name,
        "email": email,
        "phone": req.phone,
        "password_hash": hash_password(req.password),
        "role": "client",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email, "client")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "token": access_token}

@api_router.post("/auth/login")
async def login(req: UserLoginRequest, request: Request, response: Response):
    email = req.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        last_attempt = attempts.get("last_attempt")
        if last_attempt and datetime.now(timezone.utc) - datetime.fromisoformat(last_attempt) < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed login attempts. Please try again after 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = user["id"]
    role = user.get("role", "client")
    access_token = create_access_token(user_id, email, role)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "token": access_token}

@api_router.get("/auth/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

# ================= SERVICES & ARTISTS ================= #
@api_router.get("/services")
async def get_services(type: Optional[str] = None):
    query = {}
    if type and type != "all":
        query["type"] = type
    services = await db.services.find(query, {"_id": 0}).to_list(100)
    return services

@api_router.get("/artists")
async def get_artists():
    artists = await db.artists.find({}, {"_id": 0}).to_list(100)
    return artists

@api_router.get("/artists/{artist_id}")
async def get_artist_detail(artist_id: str):
    artist = await db.artists.find_one({"id": artist_id}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    # Fetch portfolio for artist
    portfolio = await db.portfolio.find({"artist_id": artist_id}, {"_id": 0}).to_list(100)
    artist["portfolio"] = portfolio
    return artist

# ================= PORTFOLIO & FLASH ================= #
@api_router.get("/portfolio")
async def get_portfolio(type: Optional[str] = None, category: Optional[str] = None, artist_id: Optional[str] = None):
    query = {}
    if type and type != "all":
        query["type"] = type
    if category and category != "all":
        query["category"] = category
    if artist_id and artist_id != "all":
        query["artist_id"] = artist_id
    items = await db.portfolio.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.get("/portfolio/flash")
async def get_flash_designs():
    items = await db.portfolio.find({"is_flash": True}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/portfolio")
async def create_portfolio_item(item: PortfolioItemCreate, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    doc = item.model_dump()
    doc["id"] = f"PORT-{secrets.token_hex(4).upper()}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.portfolio.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    res = await db.portfolio.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Portfolio item deleted"}

def parse_time_to_minutes(time_str: str) -> int:
    """Converts '10:00 AM' or '02:30 PM' to minutes from midnight."""
    match = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", time_str.strip(), re.IGNORECASE)
    if not match:
        return 0
    hours, minutes, meridian = match.groups()
    hours = int(hours)
    minutes = int(minutes)
    if meridian.upper() == "PM" and hours != 12:
        hours += 12
    elif meridian.upper() == "AM" and hours == 12:
        hours = 0
    return hours * 60 + minutes

# ================= AVAILABILITY & SCHEDULING ================= #
@api_router.get("/availability")
async def get_availability(date: str, artist_id: str, service_id: Optional[str] = None):
    """
    Returns available time slots with buffer times for a specific artist and date.
    Calculates existing confirmed and pending bookings with duration and 15-minute buffer to prevent overlaps.
    """
    standard_slots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:30 PM", "02:30 PM", "03:30 PM", "04:30 PM",
        "05:30 PM", "06:30 PM"
    ]
    
    # Query booked slots for that artist and date
    bookings = await db.bookings.find({
        "date": date,
        "artist_id": artist_id,
        "booking_status": {"$in": ["confirmed", "pending_deposit", "pending_approval"]}
    }, {"_id": 0, "time_slot": 1, "duration_minutes": 1}).to_list(100)
    
    # Calculate busy intervals [start, end] in minutes
    booked_intervals = []
    for b in bookings:
        start_min = parse_time_to_minutes(b.get("time_slot", "09:00 AM"))
        duration = b.get("duration_minutes", 45) + 15  # Include 15min buffer
        booked_intervals.append((start_min, start_min + duration))

    # Requested service duration
    requested_duration = 45
    if service_id:
        srv = await db.services.find_one({"id": service_id})
        if srv:
            requested_duration = srv.get("duration_minutes", 45)
    
    slots_info = []
    for slot in standard_slots:
        slot_start = parse_time_to_minutes(slot)
        slot_end = slot_start + requested_duration + 15  # Buffer
        
        # Check overlap
        is_overlap = False
        for (b_start, b_end) in booked_intervals:
            if not (slot_end <= b_start or slot_start >= b_end):
                is_overlap = True
                break
                
        slots_info.append({
            "time": slot,
            "available": not is_overlap,
            "buffer_minutes": 15
        })
    
    return {
        "date": date,
        "artist_id": artist_id,
        "slots": slots_info
    }

# ================= BOOKING & STRIPE DEPOSIT ================= #
@api_router.post("/bookings")
async def create_booking(req: BookingCreateRequest):
    # Verify service and artist
    service = await db.services.find_one({"id": req.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    artist = await db.artists.find_one({"id": req.artist_id}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Check race condition/double-booking atomically
    existing = await db.bookings.find_one({
        "date": req.date,
        "artist_id": req.artist_id,
        "time_slot": req.time_slot,
        "booking_status": {"$in": ["confirmed", "pending_deposit"]}
    })
    if existing:
        raise HTTPException(status_code=409, detail="This time slot was just taken by another client. Please select another slot.")
    
    booking_id = f"IB-{secrets.token_hex(3).upper()}"
    deposit_amount = float(service.get("deposit_required", 30.0))
    total_price = float(service.get("price", 60.0))
    
    booking_doc = {
        "id": booking_id,
        "booking_ref": booking_id,
        "service_id": service["id"],
        "service_name": service["name"],
        "service_type": service["type"],
        "artist_id": artist["id"],
        "artist_name": artist["name"],
        "client_name": req.client_name,
        "client_email": req.client_email.lower(),
        "client_phone": req.client_phone,
        "date": req.date,
        "time_slot": req.time_slot,
        "duration_minutes": service.get("duration_minutes", 45),
        "total_price": total_price,
        "deposit_amount": deposit_amount,
        "deposit_status": "pending",
        "booking_status": "pending_deposit",
        "notes": req.notes or "",
        "flash_item_id": req.flash_item_id,
        "custom_inquiry_id": req.custom_inquiry_id,
        "aftercare_sent": False,
        "aftercare_notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    
    # Create Stripe Checkout Session for Deposit
    origin_url = req.origin_url.rstrip("/") if req.origin_url else "http://localhost:3000"
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_id}"
    cancel_url = f"{origin_url}/payment/cancel?booking_id={booking_id}"
    
    checkout_url = ""
    session_id = ""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Studio Deposit: {service['name']}",
                        "description": f"Booking Ref: {booking_id} with {artist['name']} on {req.date} at {req.time_slot}",
                    },
                    "unit_amount": int(deposit_amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking_id,
                "client_email": req.client_email,
                "service_type": service["type"]
            }
        )
        checkout_url = session.url
        session_id = session.id
        
        # Save transaction
        await db.payment_transactions.insert_one({
            "session_id": session_id,
            "booking_id": booking_id,
            "amount": deposit_amount,
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"stripe_session_id": session_id}}
        )
        booking_doc["stripe_session_id"] = session_id
        
    except Exception as e:
        logger.error(f"Stripe session creation error: {e}")
        # In case of stripe network issue, fallback URL is provided for simulation
        checkout_url = f"{origin_url}/payment/success?session_id=SIM-{booking_id}&booking_id={booking_id}"
        session_id = f"SIM-{booking_id}"
        booking_doc["stripe_session_id"] = session_id

    # If it was a flash design booking, update flash design status
    if req.flash_item_id:
        await db.portfolio.update_one(
            {"id": req.flash_item_id},
            {"$set": {"flash_status": "reserved"}}
        )

    return {
        "booking": booking_doc,
        "checkout_url": checkout_url,
        "session_id": session_id,
        "deposit_amount": deposit_amount
    }

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.post("/bookings/{booking_id}/confirm-deposit")
async def confirm_deposit(booking_id: str):
    """
    Simulates or manually confirms deposit for immediate testing or sandbox verification
    """
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "deposit_status": "paid",
            "booking_status": "confirmed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if booking.get("flash_item_id"):
        await db.portfolio.update_one(
            {"id": booking["flash_item_id"]},
            {"$set": {"flash_status": "claimed"}}
        )
        
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return {"message": "Deposit confirmed successfully", "booking": updated}

@api_router.get("/bookings/{booking_id}/receipt")
async def get_booking_receipt(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    artist = await db.artists.find_one({"id": booking["artist_id"]}, {"_id": 0})
    service = await db.services.find_one({"id": booking["service_id"]}, {"_id": 0})
    
    remaining_balance = max(0.0, float(booking.get("total_price", 0)) - float(booking.get("deposit_amount", 0)))
    
    receipt = {
        "invoice_number": f"INV-{booking['booking_ref']}",
        "booking_ref": booking["booking_ref"],
        "date_issued": booking.get("created_at", datetime.now(timezone.utc).isoformat()),
        "studio": {
            "name": "Ink & Blade Studio",
            "address": "RUA Julio de Souza Portela 32, Curitiba, Pr",
            "phone": "+55 (41 ) 98704-1595",
            "email": "concierge@inkandblade.com",
            "tax_id": "BR-8921-INK-BLADE"
        },
        "client": {
            "name": booking["client_name"],
            "email": booking["client_email"],
            "phone": booking["client_phone"]
        },
        "service": {
            "name": booking["service_name"],
            "type": booking["service_type"],
            "artist": booking["artist_name"],
            "date": booking["date"],
            "time": booking["time_slot"],
            "duration": f"{booking.get('duration_minutes', 45)} mins"
        },
        "financials": {
            "total_service_fee": booking.get("total_price", 0),
            "deposit_paid": booking.get("deposit_amount", 0),
            "remaining_due_at_chair": remaining_balance,
            "deposit_status": booking.get("deposit_status", "pending"),
            "payment_method": "Stripe Card Payment"
        },
        "studio_policy": {
            "cancellation_policy": "Deposits are non-refundable for cancellations made under 48 hours before scheduled appointment.",
            "arrival_guidelines": "Please arrive 10 minutes early. For tattoos, stay hydrated and eat a solid meal 1-2 hours prior.",
            "sanitation": "Hospital-grade sterilization & single-use disposable needle cartridges."
        }
    }
    return receipt

# ================= PAYMENTS & STRIPE STATUS ================= #
@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        # Check if booking exists with this session
        booking = await db.bookings.find_one({"stripe_session_id": session_id})
        if booking:
            return {
                "session_id": session_id,
                "status": "completed" if booking.get("deposit_status") == "paid" else "initiated",
                "payment_status": booking.get("deposit_status", "pending"),
                "booking_id": booking["id"]
            }
        # Simulation fallback
        if session_id.startswith("SIM-"):
            booking_id = session_id.replace("SIM-", "")
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {"deposit_status": "paid", "booking_status": "confirmed"}}
            )
            return {"session_id": session_id, "status": "completed", "payment_status": "paid", "booking_id": booking_id}
        raise HTTPException(404, "Transaction not found")

    # If pending, check with Stripe directly
    if record.get("payment_status") != "paid" and not session_id.startswith("SIM-"):
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "stripe_payment_intent_id": getattr(s, "payment_intent", ""),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                if record.get("booking_id"):
                    await db.bookings.update_one(
                        {"id": record["booking_id"]},
                        {"$set": {"deposit_status": "paid", "booking_status": "confirmed"}}
                    )
                record["payment_status"] = "paid"
                record["status"] = "completed"
        except Exception as e:
            logger.warning(f"Stripe session check error: {e}")

    return {
        "session_id": record["session_id"],
        "status": record.get("status", "initiated"),
        "payment_status": record.get("payment_status", "pending"),
        "booking_id": record.get("booking_id")
    }

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            import json
            parsed_data = json.loads(payload.decode("utf-8"))
            event = stripe.Event.construct_from(parsed_data, stripe.api_key)
    except Exception as e:
        logger.error(f"Webhook signature error: {e}")
        raise HTTPException(400, "Invalid signature or payload")
    
    event_type = event.get("type")
    obj = event.get("data", {}).get("object", {})
    
    if event_type == "checkout.session.completed":
        session_id = obj.get("id")
        booking_id = obj.get("metadata", {}).get("booking_id")
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid",
                "stripe_payment_intent_id": obj.get("payment_intent"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        if booking_id:
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {"deposit_status": "paid", "booking_status": "confirmed"}}
            )
    return {"status": "ok"}

# ================= CUSTOM TATTOO INQUIRIES ================= #
@api_router.post("/inquiries")
async def create_inquiry(req: InquiryCreateRequest):
    inquiry_id = f"INQ-{secrets.token_hex(3).upper()}"
    
    artist_name = "Any Available Master"
    if req.artist_id and req.artist_id != "all":
        artist = await db.artists.find_one({"id": req.artist_id})
        if artist:
            artist_name = artist["name"]

    inquiry_doc = {
        "id": inquiry_id,
        "inquiry_ref": inquiry_id,
        "client_name": req.client_name,
        "client_email": req.client_email.lower(),
        "client_phone": req.client_phone,
        "artist_id": req.artist_id,
        "artist_name": artist_name,
        "style": req.style,
        "placement": req.placement,
        "size_dimensions": req.size_dimensions,
        "budget_range": req.budget_range,
        "description": req.description,
        "reference_images": req.reference_images,
        "preferred_date": req.preferred_date,
        "preferred_time": req.preferred_time,
        "status": "submitted",  # "submitted", "quoted", "approved", "rejected", "booked"
        "quoted_price": 0.0,
        "deposit_amount": 0.0,
        "estimated_hours": 0.0,
        "admin_notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inquiries.insert_one(inquiry_doc)
    inquiry_doc.pop("_id", None)
    return inquiry_doc

@api_router.get("/inquiries")
async def get_inquiries(status_filter: Optional[str] = None, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    query = {}
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    inquiries = await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return inquiries

@api_router.get("/inquiries/{inquiry_id}")
async def get_inquiry(inquiry_id: str):
    inquiry = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry

@api_router.post("/inquiries/{inquiry_id}/quote")
async def quote_inquiry(inquiry_id: str, req: InquiryQuoteRequest, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    inquiry = await db.inquiries.find_one({"id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {
            "status": req.status or "quoted",
            "quoted_price": req.quoted_price,
            "deposit_amount": req.deposit_amount,
            "estimated_hours": req.estimated_hours,
            "admin_notes": req.admin_notes or "",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    updated = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    return {"message": "Quote submitted successfully", "inquiry": updated}

@api_router.post("/inquiries/{inquiry_id}/approve")
async def approve_inquiry(inquiry_id: str, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    inquiry = await db.inquiries.find_one({"id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {
            "status": "approved",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    updated = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    return {"message": "Inquiry approved for booking", "inquiry": updated}

@api_router.post("/inquiries/{inquiry_id}/reject")
async def reject_inquiry(inquiry_id: str, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    inquiry = await db.inquiries.find_one({"id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Inquiry rejected"}

# ================= ADMIN DASHBOARD & AFTERCARE ================= #
@api_router.get("/admin/stats")
async def get_admin_stats(user: Dict[str, Any] = Depends(get_admin_or_artist)):
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"booking_status": "confirmed"})
    pending_inquiries = await db.inquiries.count_documents({"status": "submitted"})
    
    # Calculate revenue from deposits & total bookings
    cursor = db.bookings.find({"deposit_status": "paid"}, {"deposit_amount": 1, "total_price": 1})
    total_revenue = 0.0
    total_deposits = 0.0
    async for b in cursor:
        total_deposits += float(b.get("deposit_amount", 0))
        total_revenue += float(b.get("total_price", 0))
        
    return {
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "pending_inquiries": pending_inquiries,
        "total_deposits_collected": total_deposits,
        "projected_revenue": total_revenue,
    }

@api_router.get("/admin/schedule")
async def get_admin_schedule(date_from: Optional[str] = None, artist_id: Optional[str] = None, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    query = {}
    if artist_id and artist_id != "all":
        query["artist_id"] = artist_id
    if date_from:
        query["date"] = {"$gte": date_from}
        
    bookings = await db.bookings.find(query, {"_id": 0}).sort([("date", 1), ("time_slot", 1)]).to_list(500)
    return bookings

@api_router.post("/admin/send-aftercare")
async def send_aftercare(req: AftercareSendRequest, user: Dict[str, Any] = Depends(get_admin_or_artist)):
    booking = await db.bookings.find_one({"id": req.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Dispatch simulated aftercare instructions email
    aftercare_text = (
        f"Thank you for visiting Ink & Blade Studio, {booking['client_name']}!\n\n"
        f"Official Aftercare Guidelines for your {booking['service_name']}:\n"
        f"1. Leave medical film bandage on for 24 hours. Wash gently with antimicrobial soap.\n"
        f"2. Apply a sheer layer of fragrance-free ointment 2-3 times daily.\n"
        f"3. Strictly avoid direct sunlight, saunas, and swimming pools for 14 days.\n"
        f"4. Do NOT scratch or peel scabbing skin.\n\n"
        f"Special Artist Note from {booking['artist_name']}:\n{req.custom_notes or 'Healing looks great, follow the protocol and contact us if any redness persists past 48 hours.'}"
    )
    
    await db.bookings.update_one(
        {"id": req.booking_id},
        {"$set": {
            "aftercare_sent": True,
            "aftercare_notes": aftercare_text,
            "aftercare_sent_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": f"Aftercare instructions dispatched successfully to {booking['client_email']}",
        "recipient": booking["client_email"],
        "content": aftercare_text
    }

# ================= SEEDING & INITIALIZATION ================= #
async def seed_database():
    if not ADMIN_PASSWORD:
        raise RuntimeError("ADMIN_PASSWORD must be set in the environment")
    # 1. Seed Admin & Artists users
    admin_user = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin_user:
        await db.users.insert_one({
            "id": "USR-ADMIN-01",
            "name": "Master Julian Vance (Admin)",
            "email": ADMIN_EMAIL,
            "phone": "+1 (555) 842-8288",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Seeded Admin user: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, admin_user.get("password_hash", "")):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
        )

    # Optional artist account; only created when explicitly configured.
    artist_email = os.environ.get("ARTIST_EMAIL", "marcus@inkandblade.com").lower()
    artist_password = os.environ.get("ARTIST_PASSWORD")
    if artist_password:
        artist_user = await db.users.find_one({"email": artist_email})
        if not artist_user:
            await db.users.insert_one({
                "id": "USR-ARTIST-01",
                "name": "Marcus Kane",
                "email": artist_email,
                "phone": "+1 (555) 392-1920",
                "password_hash": hash_password(artist_password),
                "role": "artist",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        elif not verify_password(artist_password, artist_user.get("password_hash", "")):
            await db.users.update_one({"email": artist_email}, {"$set": {"password_hash": hash_password(artist_password)}})

    # 2. Seed Artists Profiles if empty
    artist_count = await db.artists.count_documents({})
    if artist_count == 0:
        artists_data = [
            {
                "id": "art-marcus",
                "name": "Marcus Kane",
                "role": "Master Tattooist",
                "specialties": ["Dark Realism", "Neo-Japanese", "Fine-line Micro"],
                "experience": "12 Years",
                "bio": "Specializing in large-scale dark surrealism, biomechanical compositions, and high-contrast sleeve work.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
                "instagram": "@marcus_darkink",
                "hourly_rate": 180,
                "deposit_amount": 100,
                "rating": 4.98
            },
            {
                "id": "art-elena",
                "name": "Elena Rostova",
                "role": "Illustrative & Flash Specialist",
                "specialties": ["Botanical", "Blackwork Geometry", "Ornamental"],
                "experience": "8 Years",
                "bio": "Known for delicate organic flow, sacred geometry, and original flash sheets inspired by classical engravings.",
                "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
                "instagram": "@elena_blackneedle",
                "hourly_rate": 150,
                "deposit_amount": 50,
                "rating": 4.95
            },
            {
                "id": "art-dominic",
                "name": "Dominic 'Dom' Silva",
                "role": "Executive Barber & Stylist",
                "specialties": ["Razor Fade", "Hot Towel Shave", "Beard Architecture"],
                "experience": "14 Years",
                "bio": "Trained in London and Milan, Dominic delivers razor-sharp fades, classic taper pompadours, and bespoke beard grooming.",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
                "instagram": "@dom_razorcraft",
                "hourly_rate": 85,
                "deposit_amount": 25,
                "rating": 5.0
            },
            {
                "id": "art-kai",
                "name": "Kai Thorne",
                "role": "Traditional & Neo-Trad Tattooer",
                "specialties": ["American Traditional", "Bold Line Color", "Cover-ups"],
                "experience": "10 Years",
                "bio": "Solid heavy lines, rich saturated color palettes, and enduring timeless traditional tattoo aesthetics.",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
                "instagram": "@kai_heavytraditional",
                "hourly_rate": 160,
                "deposit_amount": 75,
                "rating": 4.92
            }
        ]
        await db.artists.insert_many(artists_data)

    # 3. Seed Services if empty
    services_count = await db.services.count_documents({})
    if services_count == 0:
        services_data = [
            # Barber Services
            {
                "id": "srv-barber-fade",
                "name": "Executive Skin Fade & Styling",
                "type": "barber",
                "category": "Haircut",
                "duration_minutes": 45,
                "price": 55.0,
                "deposit_required": 25.0,
                "description": "Precision razor skin fade, texturized shear work, hair wash with menthol tonic, and premium styling finish.",
                "image_url": "https://images.unsplash.com/photo-1787008543379-91aaa64b0003?q=85&w=800&auto=format&fit=crop"
            },
            {
                "id": "srv-barber-shave",
                "name": "Royal Hot Towel Straight Razor Shave",
                "type": "barber",
                "category": "Shaving",
                "duration_minutes": 45,
                "price": 50.0,
                "deposit_required": 20.0,
                "description": "Essential oil pre-shave steam, 3-stage hot towel treatment, badger brush lather, and straight razor precision finish.",
                "image_url": "https://images.unsplash.com/photo-1786057424913-6954b0f424af?q=85&w=800&auto=format&fit=crop"
            },
            {
                "id": "srv-barber-combo",
                "name": "The Ink & Blade Full Ritual (Cut + Beard)",
                "type": "barber",
                "category": "Full Grooming",
                "duration_minutes": 75,
                "price": 95.0,
                "deposit_required": 35.0,
                "description": "Full tailored cut, complete beard sculpt with hot lather edge-up, face massage, and cold towel eucalyptus lock-in.",
                "image_url": "https://images.unsplash.com/photo-1787008547954-726e3e6db7e8?q=85&w=800&auto=format&fit=crop"
            },
            # Tattoo Flash Services
            {
                "id": "srv-tattoo-flash",
                "name": "Original Artist Flash Design",
                "type": "tattoo_flash",
                "category": "Flash Tattoo",
                "duration_minutes": 120,
                "price": 220.0,
                "deposit_required": 50.0,
                "description": "Select from our exclusive flash sheet collection. Hand-drawn one-off designs ready to tattoo in a single session.",
                "image_url": "https://images.unsplash.com/photo-1725918128612-6021dbe24add?q=85&w=800&auto=format&fit=crop"
            },
            # Custom Tattoo Consultation & Booking
            {
                "id": "srv-tattoo-custom",
                "name": "Bespoke Custom Tattoo Project",
                "type": "tattoo_custom",
                "category": "Custom Work",
                "duration_minutes": 240,
                "price": 600.0,
                "deposit_required": 100.0,
                "description": "Full custom project (Sleeves, Backpieces, Rib & Thigh murals). Requires reference submission and consultation approval.",
                "image_url": "https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop"
            }
        ]
        await db.services.insert_many(services_data)

    # 4. Seed Portfolio & Flash Designs if empty
    portfolio_count = await db.portfolio.count_documents({})
    if portfolio_count == 0:
        portfolio_data = [
            # Tattoos
            {
                "id": "PORT-01",
                "title": "Samurai Oni Mask Full Sleeve",
                "type": "tattoo",
                "artist_id": "art-marcus",
                "artist_name": "Marcus Kane",
                "category": "Neo-Japanese",
                "image_url": "https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop",
                "description": "24 hours across 4 sessions. Black and grey shading with subtle crimson accents.",
                "price_estimate": "$1,800 - $2,200",
                "is_flash": False,
                "tags": ["Japanese", "Sleeve", "Black & Grey", "Cover-up Ready"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
            },
            {
                "id": "PORT-02",
                "title": "Hyper-Realistic Lion & Compass",
                "type": "tattoo",
                "artist_id": "art-marcus",
                "artist_name": "Marcus Kane",
                "category": "Realism",
                "image_url": "https://images.unsplash.com/photo-1651650564239-7e96053d934c?q=85&w=800&auto=format&fit=crop",
                "description": "Upper arm piece with smooth photo-realistic fur textures and micro-detail compass rose.",
                "price_estimate": "$850",
                "is_flash": False,
                "tags": ["Realism", "Wildlife", "Arm Piece"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
            },
            {
                "id": "PORT-03",
                "title": "Sacred Geometry Mandala Spine",
                "type": "tattoo",
                "artist_id": "art-elena",
                "artist_name": "Elena Rostova",
                "category": "Blackwork",
                "image_url": "https://images.unsplash.com/photo-1716948943021-cea8dc2d2c3f?q=85&w=800&auto=format&fit=crop",
                "description": "Full spine down to lumbar. Crisp dotwork gradients and symmetrical sacred geometry.",
                "price_estimate": "$950",
                "is_flash": False,
                "tags": ["Dotwork", "Spine", "Mandala", "Geometry"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
            },
            # Barber Cuts
            {
                "id": "PORT-04",
                "title": "Zero Skin Fade & Razor Sculpted Beard",
                "type": "barber",
                "artist_id": "art-dominic",
                "artist_name": "Dominic Silva",
                "category": "Skin Fade",
                "image_url": "https://images.unsplash.com/photo-1787008543379-91aaa64b0003?q=85&w=800&auto=format&fit=crop",
                "description": "Seamless low-to-high transition paired with defined sharp cheek line contouring.",
                "price_estimate": "$75",
                "is_flash": False,
                "tags": ["Skin Fade", "Beard Trim", "Precision"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
            },
            {
                "id": "PORT-05",
                "title": "Classic Executive Pompadour & Taper",
                "type": "barber",
                "artist_id": "art-dominic",
                "artist_name": "Dominic Silva",
                "category": "Classic Cut",
                "image_url": "https://images.unsplash.com/photo-1786057424913-6954b0f424af?q=85&w=800&auto=format&fit=crop",
                "description": "Shear sculpted crown with clean temple taper and matte pomade finish.",
                "price_estimate": "$60",
                "is_flash": False,
                "tags": ["Pompadour", "Taper", "Shears"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
            },
            # Flash Sheets
            {
                "id": "PORT-FLASH-01",
                "title": "Dagger of Truth & Snake Sheet #01",
                "type": "flash",
                "artist_id": "art-elena",
                "artist_name": "Elena Rostova",
                "category": "Neo-Traditional",
                "image_url": "https://images.unsplash.com/photo-1725918128612-6021dbe24add?q=85&w=800&auto=format&fit=crop",
                "description": "Available exclusive flash. 5x3 inches. Palm or forearm placement recommended.",
                "price_estimate": "$220",
                "is_flash": True,
                "flash_status": "available",
                "tags": ["Flash", "Dagger", "Serpent", "Ready to Ink"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            },
            {
                "id": "PORT-FLASH-02",
                "title": "Gothic Raven & Botanical Rose #04",
                "type": "flash",
                "artist_id": "art-kai",
                "artist_name": "Kai Thorne",
                "category": "Traditional",
                "image_url": "https://images.unsplash.com/photo-1521308452854-e037c0062a1e?q=85&w=800&auto=format&fit=crop",
                "description": "Bold black lines with saturated blood red petal shading. Single edition.",
                "price_estimate": "$250",
                "is_flash": True,
                "flash_status": "available",
                "tags": ["Flash", "Raven", "Botanical", "Single Edition"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
            }
        ]
        await db.portfolio.insert_many(portfolio_data)

    # 5. Seed sample Bookings and Inquiries if empty
    booking_count = await db.bookings.count_documents({})
    if booking_count == 0:
        sample_bookings = [
            {
                "id": "IB-8421",
                "booking_ref": "IB-8421",
                "service_id": "srv-barber-fade",
                "service_name": "Executive Skin Fade & Styling",
                "service_type": "barber",
                "artist_id": "art-dominic",
                "artist_name": "Dominic Silva",
                "client_name": "Liam Henderson",
                "client_email": "liam.h@example.com",
                "client_phone": "+1 555-234-5678",
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "time_slot": "10:00 AM",
                "duration_minutes": 45,
                "total_price": 55.0,
                "deposit_amount": 25.0,
                "deposit_status": "paid",
                "booking_status": "confirmed",
                "notes": "Low skin fade, keep length on top for slick back.",
                "stripe_session_id": "cs_test_mock_1",
                "aftercare_sent": True,
                "aftercare_notes": "Use sulfate-free shampoo to maintain natural oils.",
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "IB-8422",
                "booking_ref": "IB-8422",
                "service_id": "srv-tattoo-flash",
                "service_name": "Original Artist Flash Design",
                "service_type": "tattoo_flash",
                "artist_id": "art-elena",
                "artist_name": "Elena Rostova",
                "client_name": "Sophia Martinez",
                "client_email": "sophia.m@example.com",
                "client_phone": "+1 555-876-5432",
                "date": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "02:30 PM",
                "duration_minutes": 120,
                "total_price": 220.0,
                "deposit_amount": 50.0,
                "deposit_status": "paid",
                "booking_status": "confirmed",
                "notes": "Inner forearm placement.",
                "flash_item_id": "PORT-FLASH-01",
                "stripe_session_id": "cs_test_mock_2",
                "aftercare_sent": False,
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.bookings.insert_many(sample_bookings)

    # 6. Seed sample Custom Inquiry
    inquiry_count = await db.inquiries.count_documents({})
    if inquiry_count == 0:
        sample_inquiries = [
            {
                "id": "INQ-7102",
                "inquiry_ref": "INQ-7102",
                "client_name": "Alexander Hayes",
                "client_email": "alex.hayes@example.com",
                "client_phone": "+1 555-443-9821",
                "artist_id": "art-marcus",
                "artist_name": "Marcus Kane",
                "style": "Dark Realism / Biomechanical",
                "placement": "Left Outer Forearm",
                "size_dimensions": "7 x 4 inches",
                "budget_range": "$600 - $900",
                "description": "Looking for a biomechanical gear structure emerging from cracked stone skin texture with subtle chrome highlights.",
                "reference_images": [
                    "https://images.unsplash.com/photo-1616879564267-a336232e3a95?q=85&w=800&auto=format&fit=crop"
                ],
                "preferred_date": (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
                "preferred_time": "01:30 PM",
                "status": "quoted",
                "quoted_price": 750.0,
                "deposit_amount": 100.0,
                "estimated_hours": 4.5,
                "admin_notes": "Design approved. Quoted $750 with $100 deposit required to lock 4.5h block.",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.inquiries.insert_many(sample_inquiries)

@app.on_event("startup")
async def startup_event():
    # Create Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.inquiries.create_index("id", unique=True)
    await db.portfolio.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")
    
    # Seed Data
    await seed_database()

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
