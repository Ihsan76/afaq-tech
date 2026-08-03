"""Currency resolution for plan pricing.

Pricing is shown in a currency chosen automatically from the request locale
(or a user preference), while the payment gateway still charges the account's
base currency. Currencies and their exchange rates are managed dynamically by
the admin (apps.subscriptions.models.Currency). Per-plan overrides live in
Plan.prices; otherwise the price is computed as ``base price * rate``.
"""

from .models import active_currencies, base_currency_code

DEFAULT_CURRENCY = 'JOD'

# Map of the platform's 10 locales to a sensible default currency.
LOCALE_CURRENCIES = {
    'ar': 'JOD',
    'en': 'USD',
    'fr': 'EUR',
    'tr': 'TRY',
    'ur': 'PKR',
    'es': 'EUR',
    'de': 'EUR',
    'id': 'IDR',
    'bn': 'BDT',
    'fa': 'USD',
}


def _valid_currency(code):
    return active_currencies().filter(code=code).exists()


def currency_for_locale(locale=''):
    """Best-effort currency for a language locale, falling back to base."""
    code = LOCALE_CURRENCIES.get((locale or '').lower().split('-')[0], DEFAULT_CURRENCY)
    if _valid_currency(code):
        return code
    return base_currency_code()


def resolve_currency(request, override=''):
    """Pick the display currency for a request.

    Priority:
        1. explicit override (?currency= / purchase payload)
        2. the authenticated user's preferred_currency
        3. the request locale mapping
        4. the platform's base currency

    Resolved codes are validated against the active currencies managed by the
    admin; an unknown/inactive code falls back to the base currency.
    """
    candidates = []

    if override and isinstance(override, str):
        override = override.strip().upper()
        if len(override) == 3:
            candidates.append(override)

    query_params = getattr(request, 'query_params', None)
    if query_params is not None:
        qp_currency = query_params.get('currency')
        if qp_currency and len(str(qp_currency).strip()) == 3:
            candidates.append(str(qp_currency).strip().upper())
    elif hasattr(request, 'GET'):
        qp_currency = request.GET.get('currency')
        if qp_currency and len(str(qp_currency).strip()) == 3:
            candidates.append(str(qp_currency).strip().upper())

    user = getattr(request, 'user', None)
    if user and getattr(user, 'preferred_currency', ''):
        preferred = user.preferred_currency.strip().upper()
        if len(preferred) == 3:
            candidates.append(preferred)

    for candidate in candidates:
        if _valid_currency(candidate):
            return candidate

    locale = getattr(request, 'LANGUAGE_CODE', '') or ''
    if query_params is not None and query_params.get('locale'):
        locale = query_params.get('locale')
    return currency_for_locale(locale)
