#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_message(user_id, role, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO chat_history (user_id, role, content)
        VALUES (?, ?, ?)
    ''', (user_id, role, content))
    conn.commit()
    conn.close()

def get_history(user_id, limit=10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT role, content FROM chat_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    ''', (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

init_db()
