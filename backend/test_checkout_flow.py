#!/usr/bin/env python3
"""End-to-end smoke test for the subscriptions purchase flow (MyFatoorah Test mode).

Usage:
    python test_checkout_flow.py --email you@example.com --password '...' [--plan pro]

Steps performed:
    1. Login (JWT) -> access token
    2. GET  /api/v1/subscriptions/plans/
    3. POST /api/v1/subscriptions/purchase/ -> checkout_url
    4. Prints the payment URL for you to open in a browser, then optionally
       polls /api/v1/subscriptions/current/ until the subscription activates.

Works against a locally-running backend (default http://127.0.0.1:8003/api/v1).
While waiting for the MyFatoorah account approval, keep MYFATOORAH_BASE_URL empty
so the provider uses Test mode (apitest.myfatoorah.com) — no live keys required.

Example:
    export TEST_EMAIL="you@example.com"
    export TEST_PASSWORD="secret"
    python test_checkout_flow.py --plan pro --locale ar --poll 30
"""

import argparse
import os
import sys
import time

import requests

DEFAULT_API = "http://127.0.0.1:8003/api/v1"
PLAN_CODES = {"free", "pro", "school", "enterprise"}


def main():
    parser = argparse.ArgumentParser(description="Smoke-test the subscription checkout flow.")
    parser.add_argument("--api", default=os.environ.get("TEST_API", DEFAULT_API), help="API base URL")
    parser.add_argument("--email", default=os.environ.get("TEST_EMAIL", ""))
    parser.add_argument("--password", default=os.environ.get("TEST_PASSWORD", ""))
    parser.add_argument("--plan", default="pro", choices=sorted(PLAN_CODES), help="Plan code to buy")
    parser.add_argument("--locale", default="en", help="Response/return language (ar/en/fr/tr/ur/es/de/id/bn/fa)")
    parser.add_argument("--poll", type=int, default=0, help="Poll seconds between /current/ checks (0 = skip)")
    parser.add_argument("--timeout", type=int, default=180, help="Max seconds to wait for activation when polling")
    args = parser.parse_args()

    if not args.email or not args.password:
        parser.error("Provide --email/--password or set TEST_EMAIL/TEST_PASSWORD")

    api = args.api.rstrip("/")
    session = requests.Session()
    timeout = 30

    print(f"[1/4] Logging in as {args.email} ...")
    resp = session.post(f"{api}/auth/login/", json={"email": args.email, "password": args.password}, timeout=timeout)
    resp.raise_for_status()
    token = resp.json()["access"]
    session.headers["Authorization"] = f"Bearer {token}"

    print(f"[2/4] Fetching plans ({api}/subscriptions/plans/?locale={args.locale}) ...")
    plans = session.get(f"{api}/subscriptions/plans/?locale={args.locale}", timeout=timeout).json()
    plan = next((p for p in plans if p.get("code") == args.plan), None)
    if not plan:
        print(f"Plan '{args.plan}' not found. Available: {[p.get('code') for p in plans]}")
        sys.exit(1)
    if float(plan["price"]) <= 0:
        print(f"Plan '{args.plan}' is free (price {plan['price']}) — purchases of free plans are rejected.")
        sys.exit(1)
    print(f"    Plan: {plan.get('code')} — {plan.get('name')} — {plan.get('price')} {plan.get('currency')}")

    print("[3/4] Creating checkout ...")
    resp = session.post(f"{api}/subscriptions/purchase/", json={"plan_id": plan["id"], "locale": args.locale}, timeout=timeout)
    data = resp.json()
    if not data.get("payment_available", True):
        print("Payment is NOT configured. Set MYFATOORAH_API_TOKEN (and MYFATOORAH_WEBHOOK_SECRET) in .env first.")
        sys.exit(1)
    print(f"    Subscription #{data.get('id')} created ({data.get('status')}) via {data.get('payment_provider')}")
    print(f"    checkout_url: {data.get('checkout_url')}")

    if not args.poll:
        print("\n[4/4] Open the checkout_url above in a browser, complete the payment,")
        print("      then re-run with --poll 15 to watch the subscription activate.")
        return

    print(f"\n[4/4] Polling /subscriptions/current/ every {args.poll}s (up to {args.timeout}s) ...")
    deadline = time.time() + args.timeout
    last = ""
    while time.time() < deadline:
        time.sleep(args.poll)
        current = session.get(f"{api}/subscriptions/current/", timeout=timeout).json()
        status = current.get("status", "")
        if status and status != last:
            print(f"    status={status}" + (f" (expires {current.get('end_at')})" if status == "active" else ""))
            last = status
        if status == "active":
            print("Subscription activated. Done.")
            return
    print("Timed out waiting for activation — the webhook may not have been delivered yet.")
    sys.exit(2)


if __name__ == "__main__":
    main()
