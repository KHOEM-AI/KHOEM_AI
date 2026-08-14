/**
 * ==============================================================================
 * static/js/market_board.js — KHOEM_AI Market Board (Gold / USD / Oil / Gas)
 * ==============================================================================
 */
"use strict";

async function loadMarketPrices() {
    const statusEl = document.getElementById("market-status");
    try {
        const res = await fetch("/api/market-prices");
        const data = await res.json();

        document.getElementById("gold-oz").textContent   = `$${data.gold_usd_per_oz.toFixed(2)}`;
        document.getElementById("gold-gram").textContent = `$${data.gold_usd_per_gram.toFixed(2)}`;
        document.getElementById("wti-price").textContent   = `$${data.wti_usd_per_bbl.toFixed(2)}`;
        document.getElementById("brent-price").textContent = `$${data.brent_usd_per_bbl.toFixed(2)}`;
        document.getElementById("gas-price").textContent   = `$${data.natgas_usd_per_mmbtu.toFixed(2)}`;
        document.getElementById("usd-khr").textContent     = `៛${data.usd_khr.toFixed(2)}`;

        // តម្លៃមាសគិតជា riel (24K, ក្នុង 1 ក្រាម) — ជំនួយសម្រាប់ហាងឆេង
        const goldKhrPerGram = data.gold_usd_per_gram * data.usd_khr;
        document.getElementById("gold-gram-khr").textContent =
            `≈ ៛${goldKhrPerGram.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

        if (statusEl) {
            statusEl.textContent = data.is_live
                ? `🟢 Live · ${data.fetched_at}`
                : `🟡 Snapshot (${data.as_of}) — មិនទាន់ភ្ជាប់ live API`;
        }
    } catch (error) {
        console.error("[KHOEM_AI Market Board] fetch error:", error);
        if (statusEl) statusEl.textContent = "🔴 មិនអាចទាញយកតម្លៃបានទេ";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadMarketPrices();
    // Refresh រៀងរាល់ 5 នាទី (ដល់ពេលមាន live API, refresh ញឹកញាប់ជាងនេះក៏បាន)
    setInterval(loadMarketPrices, 5 * 60 * 1000);
});
