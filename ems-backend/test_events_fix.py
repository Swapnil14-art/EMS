"""Quick test: login as coordinator, hit GET /events/"""
import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000"

# 1. Login as coordinator (password: Test@123)
login_data = json.dumps({"email": "coordinator@nmims.in", "password": "Test@123"}).encode()
req = urllib.request.Request(
    f"{BASE}/auth/login", data=login_data,
    headers={"Content-Type": "application/json"}
)
try:
    res = urllib.request.urlopen(req)
    tokens = json.loads(res.read())
    token = tokens["access_token"]
    print(f"Login OK - token: {token[:40]}...")
except urllib.error.HTTPError as e:
    print(f"Login failed: {e.code} - {e.read().decode()}")
    exit(1)

# 2. GET /events/
req2 = urllib.request.Request(
    f"{BASE}/events/?status=approved&page=1&size=20",
    headers={"Authorization": f"Bearer {token}", "accept": "application/json"},
)
try:
    res2 = urllib.request.urlopen(req2)
    body = res2.read().decode()
    print(f"GET /events/ -> {res2.status}")
    events = json.loads(body)
    print(f"Returned {len(events)} event(s)")
except urllib.error.HTTPError as e:
    print(f"GET /events/ failed: {e.code} - {e.read().decode()}")
