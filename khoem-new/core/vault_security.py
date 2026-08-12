#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Security primitives for the KHOEM_AI encrypted vault.

This module has no Flask routes and no database access. It is deliberately
small so it can be imported by a route blueprint without changing app.py.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import os
import secrets

from cryptography.fernet import Fernet, InvalidToken
from werkzeug.security import check_password_hash, generate_password_hash

FACE_MATCH_THRESHOLD = 0.5


def hash_password(plain_password: str) -> str:
    """Hash a password with a random PBKDF2-SHA256 salt."""
    return generate_password_hash(
        plain_password,
        method="pbkdf2:sha256",
        salt_length=16,
    )


def verify_password(plain_password: str, password_hash: str) -> bool:
    if not plain_password or not password_hash:
        return False
    try:
        return check_password_hash(password_hash, plain_password)
    except (TypeError, ValueError):
        return False


def _load_master_key() -> bytes:
    key = os.getenv("VAULT_MASTER_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "VAULT_MASTER_KEY មិនទាន់បានកំណត់ក្នុង .env — "
            "Vault មិនអាចដំណើរការដោយគ្មានវាបានទេ។"
        )
    return key.encode("ascii")


def get_fernet() -> Fernet:
    try:
        return Fernet(_load_master_key())
    except (ValueError, UnicodeEncodeError) as exc:
        raise RuntimeError(
            "VAULT_MASTER_KEY មិនមែនជា Fernet key ត្រឹមត្រូវទេ។"
        ) from exc


def encrypt_bytes(data: bytes) -> bytes:
    return get_fernet().encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    try:
        return get_fernet().decrypt(token)
    except InvalidToken as exc:
        raise ValueError(
            "ឯកសារខូច ឬកូនសោមិនត្រឹមត្រូវ — មិនអាចឌិគ្រីបបានទេ"
        ) from exc


def new_owner_id() -> str:
    return secrets.token_hex(16)


def _sign(payload: str, secret: str) -> str:
    mac = hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}.{mac}"


def issue_unlock_token(
    owner_id: str,
    secret: str,
    ttl_seconds: int,
    now_ts: int,
) -> str:
    expires_at = int(now_ts) + int(ttl_seconds)
    signed = _sign(f"{owner_id}:{expires_at}", secret)
    return base64.urlsafe_b64encode(signed.encode("utf-8")).decode("ascii")


def verify_unlock_token(
    token: str,
    owner_id: str,
    secret: str,
    now_ts: int,
) -> bool:
    try:
        signed = base64.urlsafe_b64decode(token.encode("ascii")).decode("utf-8")
        payload, mac = signed.rsplit(".", 1)
        expected_mac = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(mac, expected_mac):
            return False

        token_owner, expires_at = payload.rsplit(":", 1)
        return (
            hmac.compare_digest(token_owner, owner_id)
            and int(now_ts) <= int(expires_at)
        )
    except (ValueError, TypeError, UnicodeError):
        return False


def euclidean_distance(vec_a: list[float], vec_b: list[float]) -> float:
    if len(vec_a) != len(vec_b):
        raise ValueError("Face descriptor length mismatch")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec_a, vec_b)))


def face_matches(enrolled_json: str, candidate_descriptor: list) -> bool:
    if not enrolled_json or not isinstance(candidate_descriptor, list):
        return False
    try:
        enrolled = json.loads(enrolled_json)
        candidate = [float(value) for value in candidate_descriptor]
        return (
            len(enrolled) == 128
            and len(candidate) == 128
            and euclidean_distance(enrolled, candidate)
            <= FACE_MATCH_THRESHOLD
        )
    except (TypeError, ValueError, json.JSONDecodeError):
        return False


def serialize_descriptor(descriptor: list) -> str:
    if not isinstance(descriptor, list) or len(descriptor) != 128:
        raise ValueError("Face descriptor ត្រូវមាន 128 values")
    return json.dumps([float(value) for value in descriptor])
