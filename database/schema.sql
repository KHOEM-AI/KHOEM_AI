-- ==========================================================
-- KHOEM_AI 3.0 Enterprise Database Schema
-- Creator : KHOEM SOKSIVUTHA
-- ==========================================================

PRAGMA foreign_keys = ON;

-- ==========================================================
-- Conversation History
-- ==========================================================

CREATE TABLE IF NOT EXISTS conversations (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT NOT NULL,

    role TEXT NOT NULL,

    content TEXT NOT NULL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

CREATE INDEX IF NOT EXISTS idx_conversation_session
ON conversations(session_id);

-- ==========================================================
-- Saved Places
-- ==========================================================

CREATE TABLE IF NOT EXISTS saved_places (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT NOT NULL,

    label TEXT NOT NULL,

    latitude REAL NOT NULL,

    longitude REAL NOT NULL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

CREATE INDEX IF NOT EXISTS idx_saved_places
ON saved_places(session_id);

-- ==========================================================
-- AI Settings
-- ==========================================================

CREATE TABLE IF NOT EXISTS settings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    setting_key TEXT UNIQUE,

    setting_value TEXT

);

-- ==========================================================
-- System Logs
-- ==========================================================

CREATE TABLE IF NOT EXISTS system_logs (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    level TEXT,

    message TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================================
-- Navigator History
-- ==========================================================

CREATE TABLE IF NOT EXISTS navigator_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT,

    origin TEXT,

    destination TEXT,

    distance REAL,

    duration REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================================
-- Vision History
-- ==========================================================

CREATE TABLE IF NOT EXISTS vision_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT,

    image_name TEXT,

    question TEXT,

    answer TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================================
-- Voice Settings
-- ==========================================================

CREATE TABLE IF NOT EXISTS voice_settings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT,

    voice_name TEXT,

    language TEXT,

    rate REAL DEFAULT 1.0,

    pitch REAL DEFAULT 1.0,

    volume REAL DEFAULT 1.0

);

-- ==========================================================
-- Favorite Routes
-- ==========================================================

CREATE TABLE IF NOT EXISTS favorite_routes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT,

    route_name TEXT,

    origin_lat REAL,

    origin_lng REAL,

    destination_lat REAL,

    destination_lng REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

-- ==========================================================
-- AI Memory
-- ==========================================================

CREATE TABLE IF NOT EXISTS ai_memory (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    session_id TEXT,

    memory_key TEXT,

    memory_value TEXT,

    updated_at TEXT DEFAULT CURRENT_TIMESTAMP

);
