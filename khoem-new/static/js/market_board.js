/**
 * ==============================================================================
 * static/js/market_board.js — KHOEM_AI Market Board (Gold / USD / Oil / Gas)
 * ==============================================================================
 */
"use strict";

const MARKET_FIELDS = [
    { key: "gold_usd_per_oz",      valueId: "gold-oz",     changeId: "gold-oz-change",     prefix: "$" },
    { key: "gold_usd_per_gram",    valueId: "gold-gram",   changeId: "gold-gram-change",   prefix: "$" },
    { key: "usd_khr",              valueId: "usd-khr",     changeId: "usd-khr-change",     prefix: "៛" },
    { key: "wti_usd_per_bbl",      valueId: "wti-price",   changeId: "wti-price-change",   prefix: "$" },
    { key: "brent_usd_per_bbl",    valueId: "brent-price", changeId: "brent-price-change", prefix: "$" },
    { key: "natgas_usd_per_mmbtu", valueId: "gas-price",   changeId: "gas-price-change",   prefix: "$" },
];

function renderChange(changeId, changeData) {
    const el = document.getElementById(changeId);
    if (!el) return;

    if (!changeData) {
        el.textContent = "— N/A";
        el.style.color = "#666";
        return;
    }

    const arrow = changeData.percent >= 0 ? "▲" : "▼";
    const color = changeData.percent >= 0 ? "#00ff88" : "#ff4d4d";
    el.textContent = `${arrow} ${Math.abs(changeData.percent).toFixed(2)}%`;
    el.style.color = color;
}

function setErrorState(message) {
    const statusEl = document.getElementById("market-status");
    if (statusEl) {
        statusEl.textContent = `🔴 ${message}`;
        statusEl.style.color = "#ff4d4d";
    }
    // សម្គាល់ card ទាំងអស់ថាចាស់/error ជំនួសឲ្យទុក "--" ស្ងាត់ៗ
    MARKET_FIELDS.forEach(f => {
        const valEl = document.getElementById(f.valueId);
        if (valEl && valEl.textContent === "--") {
            valEl.textContent = "⚠️";
            valEl.title = message;
        }
    });
}

async function loadMarketPrices() {
    const statusEl = document.getElementById("market-status");
    const refreshBtn = document.getElementById("refresh-btn");

    if (refreshBtn) refreshBtn.disabled = true;
    if (statusEl) {
        statusEl.textContent = "កំពុងទាញយកទិន្នន័យ...";
        statusEl.style.color = "#888";
    }

    try {
        const res = await fetch("/api/market-prices");
        const data = await res.json();

        if (!data.ok) {
            setErrorState(data.error || "មិនអាចទាញយកតម្លៃបានទេ");
            return;
        }

        MARKET_FIELDS.forEach(f => {
            const valEl = document.getElementById(f.valueId);
            if (valEl) {
                valEl.textContent = `${f.prefix}${data[f.key].toFixed(2)}`;
                valEl.title = "";
            }
            renderChange(f.changeId, data.change ? data.change[f.key] : null);
        });

        // តម្លៃមាសគិតជា riel (24K, ក្នុង 1 ក្រាម) — ជំនួយសម្រាប់ហាងឆេង
        const goldKhrPerGram = data.gold_usd_per_gram * data.usd_khr;
        const goldKhrEl = document.getElementById("gold-gram-khr");
        if (goldKhrEl) {
            goldKhrEl.textContent =
                `≈ ៛${goldKhrPerGram.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        }

        if (statusEl) {
            const localTime = new Date(data.fetched_at).toLocaleTimeString();
            const badge = data.is_live ? "🟢 Live" : "🟡 Snapshot";
            statusEl.textContent = `${badge} · ${data.source} · ធ្វើបច្ចុប្បន្នភាពម្ដងចុងក្រោយ ${localTime}`;
            statusEl.style.color = "#888";
        }
    } catch (error) {
        console.error("[KHOEM_AI Market Board] fetch error:", error);
        setErrorState("បញ្ហាតភ្ជាប់ទៅ Server");
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadMarketPrices();

    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadMarketPrices);
    }

    // Refresh ស្វ័យប្រវត្តិរៀងរាល់ 5 នាទី (ត្រូវនឹង backend cache TTL)
    setInterval(loadMarketPrices, 5 * 60 * 1000);
});
