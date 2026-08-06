import ast
import base64
import hashlib
import json
import re

from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet():
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_api_key(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_api_key(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    return _get_fernet().decrypt(ciphertext.encode()).decode()


def _balanced_block(text, open_ch, close_ch):
    """Return the first balanced {..} or [..] block, honoring nested strings."""
    start = text.find(open_ch)
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return None


def _first_block(text):
    """Return the balanced block of the first { or [ found in text."""
    i_open = text.find("{")
    i_ar = text.find("[")
    if i_open == -1 and i_ar == -1:
        return None
    if i_open == -1:
        start_ch, close_ch = "[", "]"
    elif i_ar == -1 or i_open < i_ar:
        start_ch, close_ch = "{", "}"
    else:
        start_ch, close_ch = "[", "]"
    return _balanced_block(text, start_ch, close_ch)


def _repair_json(text):
    """Best-effort repairs for common LLM JSON mistakes."""
    text = re.sub(r"\{\{", "{", text)
    text = re.sub(r"\}\}", "}", text)
    text = re.sub(r",\s*([}\]])", r"\1", text)
    text = re.sub(r"\bNone\b", "null", text)
    text = re.sub(r"\bTrue\b", "true", text)
    text = re.sub(r"\bFalse\b", "false", text)
    text = re.sub(r"\bNaN\b", "null", text)
    text = re.sub(r"\bInfinity\b", "null", text)
    return text


def extract_json(text):
    """Parse JSON out of an AI response that may contain prose or markdown fences.

    Tries, in order: the whole response, fenced code blocks, the first balanced
    JSON object/array, light repairs (double braces, trailing commas, Python
    literals), and finally Python literal_eval for single-quoted output.

    Returns the parsed object, or raises ValueError when no valid JSON is found.
    """
    if not text:
        raise ValueError("AI response is empty")

    raw = text.strip()
    candidates = [raw]

    fenced = raw
    fence = re.search(r"```(?:json|javascript)?\s*(.*?)```", raw, re.DOTALL)
    if fence:
        fenced = fence.group(1).strip()
        candidates.append(fenced)

    for source in (raw, fenced):
        block = _first_block(source)
        if block and block not in candidates:
            candidates.append(block)

    seen = set()
    for candidate in candidates:
        for variant in (candidate, _repair_json(candidate)):
            if variant in seen:
                continue
            seen.add(variant)
            try:
                return json.loads(variant)
            except json.JSONDecodeError:
                continue

    for candidate in candidates:
        try:
            return ast.literal_eval(candidate)
        except (ValueError, SyntaxError, TypeError, NameError, MemoryError):
            continue

    snippet = raw[:300] if raw else ""
    raise ValueError(f"AI response is not valid JSON: {snippet!r}")

