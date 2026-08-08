# 🤖 KHOEM_AI 3.3 — Intelligent AI Assistant Framework

**KHOEM_AI** is a modern, lightweight, and scalable AI Assistant backend built with **Flask**, **Groq LLaMA models**, and **SQLite**. It features chat memory persistence, vision image analysis, and location memory services.

---

## ✨ Features

- **🚀 High-Performance Chat:** Powered by Groq's high-speed LLaMA 3.3 infrastructure (`llama-3.3-70b-versatile`).
- **👁️ Vision Capabilities:** Multi-modal image analysis and description using `llama-3.2-90b-vision-preview`.
- **🧠 Conversation Memory:** State-management with SQLite WAL mode to remember conversation history per session.
- **📍 Saved Places Management:** Store, query, and manage labeled geographic coordinates (`lat`, `lng`).
- **🏗️ Modular Architecture:** Clean separation of concerns between Flask REST APIs (`app.py`) and core AI logic (`core/ai_engine.py`).

---

## 🛠️ Project Structure

khoem-new/
├── app.py                # Flask application, routing, and REST API handlers
├── core/
│   └── ai_engine.py      # Core AI engine, Groq API integration, DB management
├── database/
│   └── khoem_ai.db       # SQLite Database (Auto-generated with WAL mode)
├── templates/
│   └── index.html        # Web UI interface
├── static/               # Frontend CSS, JS, and asset files
├── logs/                 # System application logs
└── .env                  # Environment configuration file

---

## 🚀 Quick Start

### 1. Requirements
- Python `3.10+`
- Groq API Key ([Get yours here](https://console.groq.com/))

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KHOEM-AI/KHOEM_AI.git
cd KHOEM_AI/khoem-new


   
MethodEndpointDescription
GET/api/statusHealth check & system version details
POST/api/chatSend message & retrieve AI response with history memory
GET/api/history/<session_id>Fetch conversation history for a session
DELETE/api/history/<session_id>Clear conversation history
POST/api/visionAnalyze base64-encoded image input
POST/api/placesSave or update a place location (lat, lng)
GET/api/places/<session_id>List all saved places for a session
DELETE/api/places/<session_id>/<label>Delete a specific saved place
