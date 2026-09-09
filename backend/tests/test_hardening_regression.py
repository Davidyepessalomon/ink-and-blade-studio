"""Regression coverage for availability buffers, checkout, webhook parsing, and admin actions."""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    from dotenv import dotenv_values
    BASE_URL = dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")
BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@inkandblade.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()


def test_availability_applies_duration_and_buffer(api):
    date = (datetime.now(timezone.utc) + timedelta(days=21)).strftime("%Y-%m-%d")
    payload = {"service_id": "srv-tattoo-flash", "artist_id": "art-marcus", "client_name": "TEST_Buffer", "client_email": f"test_{uuid.uuid4().hex[:8]}@example.com", "client_phone": "555-0100", "date": date, "time_slot": "10:00 AM", "origin_url": "https://example.com"}
    created = api.post(f"{BASE_URL}/api/bookings", json=payload)
    assert created.status_code == 200, created.text
    booking_id = created.json()["booking"]["id"]
    try:
        slots = api.get(f"{BASE_URL}/api/availability", params={"date": date, "artist_id": "art-marcus", "service_id": "srv-barber-fade"})
        assert slots.status_code == 200
        by_time = {x["time"]: x["available"] for x in slots.json()["slots"]}
        assert by_time["10:00 AM"] is False
        assert by_time["11:00 AM"] is False
        assert by_time["09:00 AM"] is True
    finally:
        api.post(f"{BASE_URL}/api/bookings/{booking_id}/confirm-deposit")


def test_guest_checkout_and_receipt(api):
    date = (datetime.now(timezone.utc) + timedelta(days=22)).strftime("%Y-%m-%d")
    payload = {"service_id": "srv-barber-fade", "artist_id": "art-dominic", "client_name": "TEST_Guest", "client_email": f"guest_{uuid.uuid4().hex[:8]}@example.com", "client_phone": "555-0101", "date": date, "time_slot": "04:30 PM", "origin_url": "https://example.com"}
    r = api.post(f"{BASE_URL}/api/bookings", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["checkout_url"] and data["session_id"]
    booking_id = data["booking"]["id"]
    receipt = api.get(f"{BASE_URL}/api/bookings/{booking_id}/receipt")
    assert receipt.status_code == 200
    assert receipt.json()["booking_ref"] == booking_id


def test_webhook_rejects_invalid_json(api):
    r = api.post(f"{BASE_URL}/api/stripe/webhook", data=b"not-json", headers={"Content-Type": "application/json"})
    assert r.status_code == 400


def test_admin_quote_and_aftercare_dispatch(api, admin):
    inquiry = api.post(f"{BASE_URL}/api/inquiries", json={"client_name": "TEST_Quote", "client_email": f"quote_{uuid.uuid4().hex[:8]}@example.com", "client_phone": "555-0102", "style": "blackwork", "placement": "arm", "size_dimensions": "4x4", "budget_range": "$500", "description": "TEST inquiry"})
    assert inquiry.status_code == 200
    inquiry_id = inquiry.json()["id"]
    quote = api.post(f"{BASE_URL}/api/inquiries/{inquiry_id}/quote", json={"quoted_price": 500, "deposit_amount": 100, "estimated_hours": 2, "admin_notes": "TEST quote"})
    assert quote.status_code == 200
    assert quote.json()["inquiry"]["status"] == "quoted"
    aftercare = api.post(f"{BASE_URL}/api/admin/send-aftercare", json={"booking_id": "IB-8421", "custom_notes": "TEST note"})
    assert aftercare.status_code == 200
    assert aftercare.json()["recipient"] == "liam.h@example.com"