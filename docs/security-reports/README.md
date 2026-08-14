# Security & QA Reports

This folder holds the output of the platform's security / user-flow / visual
audits. Reports are produced by the delegated agents using the skills in
`.agents/skills/` (`security-audit`, `user-flow-qa`, `visual-qa`) and are
always run against the **isolated throwaway environment** — never production.

## How to run an audit

```bash
# 1. (Re)build the isolated environment
bash scripts/start_security_env.sh reset
bash scripts/start_security_env.sh start
#   Frontend → http://localhost:3001
#   Backend  → http://localhost:8004/api/v1
#   Accounts → /tmp/afaqsec/accounts.txt

# 2. Launch the delegated agents (they consume the skills above):
#    - security-audit  (DAST: IDOR/XSS/SQLi/auth/payments/headers)
#    - user-flow-qa    (journeys, forms, edge states, broken fixtures)
#    - visual-qa       (screenshots + baseline diff, desktop & mobile)
```

## Report naming
`YYYY-MM-DD-<scope>.md` where scope is one of `security`, `userflows`,
`visual`, or `all`.

## Severity scale
| Level | Meaning | SLAs (suggested) |
|---|---|---|
| حرج / Critical | RCE, auth bypass, data exfiltration, payment tampering | fix within 24h |
| عالٍ / High | IDOR with data exposure, stored XSS, broken authz | fix within 1 week |
| متوسط / Medium | CSRF gaps, missing headers, weak validation | fix within 1 month |
| منخفض / Low | UX/visual regressions, cosmetic issues | backlog |

## Current status

| Report | Date | Result | Notes |
|---|---|---|---|
| _— none yet —_ | | | First audit goes here |

## CI guardrails (complementary, not a substitute)

`.github/workflows/ci.yml` `security` job runs on every push:
- `pip-audit` (Python deps), `bandit` (Python SAST)
- `npm audit --audit-level=high` (Node deps)
- `gitleaks` (secrets in git history, config `gitleaks.toml`)
- `manage.py check --deploy`

CI catching a dependency/CSP regression does **not** replace a full dynamic
audit — run the agents on a regular cadence (e.g. after every feature release).
