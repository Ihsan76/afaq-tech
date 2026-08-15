# Security & QA Report — 2026-08-15 (Superpowers Full Audit)

Scope: Second comprehensive audit run of the delegated-audit system against the **isolated throwaway environment** (`frontend :3001`, `backend :8004`, SQLite `/tmp/afaqsec/security.db`). Production was not touched.

- Environment: `bash scripts/start_security_env.sh reset && start`
- Audit tooling: gitleaks, pip-audit, bandit, live DAST security audit, user-flow QA, and visual QA (agent-browser).
- Accounts: `/tmp/afaqsec/accounts.txt`

## Severity legend
حرج / Critical · عالٍ / High · متوسط / Medium · منخفض / Low · معلوماتي / Info

---

## 1. Security Findings (DAST / Live Isolated Env)

| # | Severity | Category | Check / Target | Result | Notes |
|---|---|---|---|---|---|
| A1 | — | IDOR | Calendar PATCH `/schools/schools/1/calendar/` | ✅ PASS | `school_admin.sec` 200, unauthorized/other roles 401/403/404. |
| A2 | — | IDOR | Write/delete matrix across roles | ✅ PASS | Unauthorized write/delete/escalation attempts blocked with 401/403. |
| A3 | — | IDOR | Enrollment scoping | ✅ PASS | Teachers see own section enrollments, students see own only. |
| A4 | — | IDOR | Tickets & conversations | ✅ PASS | Cross-user ticket/conversation access blocked (404). |
| A5 | — | IDOR | Marketplace orders & wallets | ✅ PASS | Buyer/provider restricted properly. |
| A6 | — | IDOR | Admin endpoints | ✅ PASS | Restricted to superuser/staff (403/302). |
| A7 | **متوسط** | Info Leak | `/api/v1/schools/analytics/` (GET) | ⚠️ FAIL | `IsAuthenticated` only (no school affiliation check); exposes site-wide aggregates to any logged-in user. |
| A8 | **عالٍ** | Access Control | Paywall bypass / paid-content gating | ⚠️ FAIL | Gating uses denormalized `user.subscription_plan` field instead of active Subscription status. Expired users retain access; active paying users are blocked if field is out of sync. |
| B1 | — | XSS | Stored payloads in tickets, announcements | ✅ PASS | Raw input accepted but escaped safely in React JSX interpolation (no `dangerouslySetInnerHTML`). |
| B2 | — | XSS | Autocomplete search reflection | ✅ PASS | Safe. |
| B3 | **عالٍ** | XSS / Upload | File upload endpoint (`/schools/attachments/`) | ⚠️ FAIL | Uploaded `.html` served inline (`text/html`, no CSP on `/media/`) from `localhost:8004` origin. Same-origin as admin cookies. |
| B4 | **متوسط** | File Access | Unauthenticated access to school media | ⚠️ FAIL | `/media/school_attachments/...` accessible without auth. |
| B5 | **متوسط** | CSP | Frontend CSP (`unsafe-inline`, `unsafe-eval`) | ⚠️ NOTE | Weakens XSS defense on Next.js client. |
| B6 | **منخفض** | XSS | Academics document HTML assembly | ⚠️ NOTE | Unescaped template insertion (admin-only, API CSP blocks scripts). |
| C1 | — | SQLi | SQL injection fuzzing on search/path params | ✅ PASS | Parameterized queries hold; no errors or data leaks. |
| D1 | — | Auth | Brute-force throttling | ✅ PASS | 5 wrong logins trigger 429 lock. |
| D2 | **منخفض** | Auth / DoS | Account lockout per-email | ⚠️ NOTE | Successful login does not reset failure counter; potential DoS vector. |
| D3 | — | Auth | JWT signature & expiration tampering | ✅ PASS | Invalidated correctly (401). |
| D4 | **منخفض** | Auth | Access token survives logout | ⚠️ NOTE | Access token valid up to 60 min after logout (refresh token blacklisted). |
| D5 | — | Auth | Duplicate email registration | ✅ PASS | Clean 400 error. |
| D6 | **متوسط** | Error Handling | Duplicate national ID update | ⚠️ FAIL | Uncaught `IntegrityError` returns 500 debug traceback page. |
| E1 | — | Payments | Checkout flow (no real charge) | ✅ PASS | Server-side pricing verified; flow stops safely. |
| E3 | — | Payments | Expired user course enrollment | ✅ PASS | Blocked (402). |
| G3 | **متوسط** | Headers | CSP applied only to `/api/` paths | ⚠️ NOTE | Leaves media and static origins unprotected by CSP. |
| G4 | **متوسط** | Config | `DEBUG=True` stack trace leaks | ⚠️ FAIL | 404/500 responses leak internal paths and environment info. (Note: bug in core translations causing 500 on sections list). |

---

## 2. User-Flow QA Findings

| # | Severity | Page / Flow | Result | Notes |
|---|---|---|---|---|
| UF1 | — | Register → Login | ✅ PASS | Clean account creation and session creation. |
| UF2 | — | Paywall encounter | ✅ PASS | Paid e-book/course paywall displays correct pricing. |
| UF3 | — | School admin dashboard & new Calendar Settings | ✅ PASS | `/ar/school/admin/settings` loads successfully, saves week start and working days. |
| UF4 | — | Teacher workspace / Student timetable | ✅ PASS | Workspaces function correctly. |
| UF5 | **متوسط** | Mobile viewports (390px) | ⚠️ FAIL | Horizontal overflow on teacher/student workspaces due to non-wrapping header elements. |
| UF6 | **متوسط** | Auth pages CTA text | ⚠️ FAIL | `/ar/login` and `/ar/register` duplicate CTA button text ("إنشاء حساب إنشاء حساب"). |

---

## 3. Visual QA Findings (Agent-Browser)

| # | Severity | Page / Viewport | Result | Notes |
|---|---|---|---|---|
| VQ1 | — | 14 Public Pages (Arabic / English) | ✅ PASS | Clean layouts, correct RTL/LTR alignment, proper fonts. |
| VQ2 | **متوسط** | Homepage hero subtitle | ⚠️ FAIL | Unclosed HTML tag `<b>` rendered as literal text (`قبل أن تُغلق <b>وعلامة لم تغلق`). |
| VQ3 | **متوسط** | Admin sidebar on mobile (390px) | ⚠️ FAIL | Stat labels clipped in collapsed 65px sidebar. |
| VQ4 | **منخفض** | Text contrast | ⚠️ NOTE | Slate-400 muted text below WCAG AA contrast on white backgrounds. |

---

## 4. Remediation Action Items

1. **High Priority:**
   - Patch subscription gating to check actual `Subscription` status rather than denormalized `user.subscription_plan`.
   - Add MIME extension allow-listing and secure attachment serving (authenticated / disposition attachment) for `/schools/attachments/`.
2. **Medium Priority:**
   - Scope `/api/v1/schools/analytics/` to school staff/admins.
   - Fix mobile layout overflows (teacher/student headers and admin mobile sidebar).
   - Fix duplicated i18n keys on auth pages and unclosed tag in homepage subtitle fixture.
   - Extend CSP middleware to cover non-API paths (`/media/`, etc.).
3. **Low Priority:**
   - Clear failure counters on successful login.
   - Add access-token invalidation or shorter lifetime on logout.
