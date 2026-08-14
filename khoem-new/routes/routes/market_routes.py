#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
routes/market_routes.py — KHOEM_AI Market Board (Gold / USD / Oil / Gas)

ចំណាំសំខាន់៖ /api/market-prices ខាងក្រោមនេះ ត្រឡប់តម្លៃ FALLBACK ថេរ
(snapshot ថ្ងៃទី 13-14 សីហា 2026) ព្រោះនៅមិនទាន់ភ្ជាប់ទៅ API ទីផ្សារពិតប្រាកដទេ។
ដើម្បីឲ្យតម្លៃ Live ពិតប្រាកដ ត្រូវការ API key ពី provider ណាមួយ ដូចជា:
  - Gold/Silver:  metals-api.com, goldapi.io
  - Oil/Gas:      EIA API (eia.gov/opendata — free), OR alpha vantage
បន្ទាប់ពីមាន key ដាក់ក្នុង .env (e.g. METALS_API_KEY, EIA_API_KEY)
ហើយជំនួស _get_fallback_prices() ខាងក្រោមដោយហៅ API ពិតប្រាកដ។
"""

import os
import datetime
import logging
from flask import Blueprint, jsonify

market_bp = Blueprint("market", __name__)
logger = logging.getLogger(__name__)


def _get_fallback_prices() -> dict:
    """
    តម្លៃ snapshot (មិនមែន live ទេ) — ប្រើពេលមិនទាន់មាន API key ។
    កែលេខទាំងនេះដោយដៃរាល់ថ្ងៃ ឬជំនួសដោយការហៅ API ពិតប្រាកដ។
    """
    return {
        "gold_usd_per_oz":   4390.06,
        "gold_usd_per_gram": 141.14,   # 24K
        "wti_usd_per_bbl":   81.19,
        "brent_usd_per_bbl": 87.18,
        "natgas_usd_per_mmbtu": 2.74,
        "usd_khr":           4050.20,
        "as_of":             "2026-08-13/14 (snapshot — not live)",
        "is_live":           False,
    }


@market_bp.route("/api/market-prices", methods=["GET"])
def market_prices():
    """
    ត្រឡប់តម្លៃទីផ្សារបច្ចុប្បន្ន (មាស/ដុល្លារ/ប្រេង/ហ្គាស) សម្រាប់បង្ហាញលើ market_board.html ។

    TODO (ចាំបាច់ត្រូវធ្វើមុននឹងប្រើជាផ្លូវការ)៖
      1. ចុះឈ្មោះយក API key ពី provider មួយ (metals-api.com / goldapi.io សម្រាប់មាស,
         EIA Open Data សម្រាប់ប្រេង/ហ្គាស)
      2. ដាក់ key ក្នុង .env
      3. ជំនួស _get_fallback_prices() ដោយ fetch ពិតប្រាកដ + cache មួយរយៈ (ឧ. 5-10 នាទី)
         ដើម្បីជៀសវាងហួស rate-limit
    """
    prices = _get_fallback_prices()
    prices["fetched_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

    if not prices["is_live"]:
        logger.warning("market_prices: serving fallback/static data — no live API key configured")

    return jsonify(prices)
