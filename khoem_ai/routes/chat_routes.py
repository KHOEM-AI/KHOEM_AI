#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify
from core.ai_engine import call_groq
from core.database_engine import save_message, get_history

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "No JSON data provided."
        }), 400

    session_id = data.get("session_id", "default_user")
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "message": "Message is empty."
        }), 400

    save_message(session_id, "user", message)
    history = get_history(session_id, limit=6)

    success, result = call_groq(history)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 500

    save_message(session_id, "assistant", result)

    return jsonify({
        "success": True,
        "reply": result
    })
