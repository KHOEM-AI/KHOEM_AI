#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
routes/market_routes.py — KHOEM_AI Market Board (Gold / USD / Oil / Gas)

ចំណាំសំខាន់៖ /api/market-prices ត្រឡប់តម្លៃ FALLBACK ថេរ (snapshot ថ្ងៃទី 13-14 សីហា 2026)
ព្រោះនៅមិនទាន់ភ្ជាប់ទៅ live data provider ណាមួយទេ។ ដើម្បីភ្ជាប់ live:
  - Gold/Silver:  metals-api.com, goldapi.io  (LBMA benchmark vs spot — កុំច្រឡំគ្នា)
  - Oil/Gas:      EIA Open Data API (eia.gov/opendata — ឥតគិតថ្លៃ)
  - FX:           ECB reference rates ឬ provider ដទៃ (reference rate ≠ executable price)
ជំនួស _fetch_live_prices() ខាងក្រោមដោយហៅ provider ពិតប្រាកដ ពេលមាន API key ។

ស្រទាប់ដែលមានរួចហើយក្នុងឯកសារនេះ (មិនចាំបាច់កែពេលភ្ជាប់ live)៖
  - Cache ជាមួយ TTL (រក្សាទុក request កុំឲ្យបាញ់ provider រាល់វិនាទី)
  - change/change_percent field (គណនាស្វ័យប្រវត្តិពី snapshot មុន ក្នុង process memory)
  - source + market_status field ក្នុង response ដើម្បីឲ្យ UI ដឹងច្បាស់ថា live/snapshot
"""

import os
import time
import datetime
import logging
from flask import Blueprint, jsonify

market_bp = Blueprint("market", __name__)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cache (in-memory, process-local) — TTL ជា វិនាទី
# ---------------------------------------------------------------------------
_CACHE_TTL_SECONDS = 300  # 5 នាទី — ដល់ពេលមាន live API សូមកុំកាត់ឲ្យខ្លីជាងនេះ ដើម្បីជៀស rate-limit
_cache = {"data": None, "fetched_at": 0.0, "previous": None}


def _fetch_live_prices() -> dict:
    """
    TODO (ចាំបាច់ត្រូវធ្វើមុននឹងប្រើជាផ្លូវការ)៖
      1. ចុះឈ្មោះយក API key ពី provider (មាស/ប្រេង/ហ្គាស/FX)
      2. ដាក់ key ក្នុង .env (e.g. METALS_API_KEY, EIA_API_KEY)
      3. ជំនួសខ្លឹមសារខាងក្រោមដោយហៅ provider ពិតប្រាកដ + error handling
    ឥឡូវត្រឡប់ snapshot ថេរ (is_live=False) ។
    """
    return {
        "gold_usd_per_oz":      4390.06,
        "gold_usd_per_gram":    141.14,   # 24K
        "wti_usd_per_bbl":      81.19,
        "brent_usd_per_bbl":    87.18,
        "natgas_usd_per_mmbtu": 2.74,
        "usd_khr":              4050.20,
        "source":               "snapshot (2026-08-13/14) — Kitco/EIA/Wise — មិនមែន live",
        "market_status":        "snapshot",  # live | delayed | reference | snapshot
        "is_live":              False,
    }


def _compute_change(current: dict, previous: dict | None) -> dict:
    """គណនា change/change_percent ធៀបនឹង snapshot មុន (ក្នុង process memory តែប៉ុណ្ណោះ)។"""
    change = {}
    numeric_fields = [
        "gold_usd_per_oz", "gold_usd_per_gram",
        "wti_usd_per_bbl", "brent_usd_per_bbl",
        "natgas_usd_per_mmbtu", "usd_khr",
    ]
    for field in numeric_fields:
        if previous and field in previous and previous[field]:
            delta = current[field] - previous[field]
            pct = (delta / previous[field]) * 100
            change[field] = {"delta": round(delta, 4), "percent": round(pct, 2)}
        else:
            # គ្មាន snapshot មុន (ដំបូងឡើងម៉ាស៊ីន ឬ backend ទើប restart) — N/A មិនមែន 0
            change[field] = None
    return change


def _get_prices_cached() -> dict:
    """ត្រឡប់ពី cache បើនៅក្នុង TTL, បើអស់ periode ទាញថ្មី + គណនា change ធៀបនឹងលើកមុន។"""
    now = time.monotonic()
    if _cache["data"] is not None and (now - _cache["fetched_at"]) < _CACHE_TTL_SECONDS:
        return _cache["data"]

    fresh = _fetch_live_prices()
    fresh["change"] = _compute_change(fresh, _cache["previous"])

    _cache["previous"] = _cache["data"] or fresh
    _cache["data"] = fresh
    _cache["fetched_at"] = now
    return fresh


@market_bp.route("/api/market-prices", methods=["GET"])
def market_prices():
    """ត្រឡប់តម្លៃទីផ្សារបច្ចុប្បន្ន (cache 5 នាទី) + change ធៀបនឹង snapshot មុន + source/status labels."""
    try:
        prices = dict(_get_prices_cached())  # copy ដើម្បីកុំកែ cache ដោយចៃដន្យ
        prices["fetched_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

        if not prices["is_live"]:
            logger.warning("market_prices: serving snapshot data — no live provider configured yet")

        return jsonify({"ok": True, **prices})

    except Exception as exc:
        logger.exception("market_prices failed: %s", exc)
        return jsonify({
            "ok": False,
            "error": "មិនអាចទាញយកតម្លៃទីផ្សារបានទេ សូមសាកល្បងម្តងទៀត",
        }), 502
