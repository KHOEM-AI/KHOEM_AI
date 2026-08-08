#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ==============================================================================
# ថ្ងៃ 8-10: RESEARCH WITH AI — Web Search Tool
# ==============================================================================
#
# គោលបំណង៖ រៀនប្រើ "web_search" tool ជាមួយ Claude API ដើម្បីឲ្យ Claude
# អាចស្វែងរកព័ត៌មានថ្មីៗ (ព័ត៌មាន, តម្លៃ, ព្រឹត្តិការណ៍បច្ចុប្បន្ន) ដែលហួស
# ពីចំណេះដឹងដែល Claude ត្រូវបាន train ។
#
# របៀបភ្ជាប់ចូល app.py ចាស់៖ ចម្លងអនុគមន៍ខាងក្រោមទៅដាក់ក្នុង app.py
# រួចបន្ថែម route /api/research
# ==============================================================================

import os
import requests

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-4-6"


def call_claude_with_search(user_question, system_prompt=""):
    """
    ហៅ Claude API ជាមួយ web_search tool បើកដំណើរការ។
    Claude នឹងសម្រេចដោយខ្លួនឯងថាតើត្រូវស្វែងរកឬអត់ អាស្រ័យលើសំណួរ។

    ត្រឡប់ជា (success: bool, result_text: str, sources: list)
    """
    if not ANTHROPIC_API_KEY:
        return False, "សូមកំណត់ ANTHROPIC_API_KEY ជាមុនសិន", []

    headers = {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
    }

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 1500,
        "system": system_prompt or "អ្នកជាជំនួយការស្រាវជ្រាវ។ ពេលត្រូវការព័ត៌មានថ្មីៗ ចូរប្រើ web search tool។ ឆ្លើយជាភាសាខ្មែរ។",
        "messages": [{"role": "user", "content": user_question}],
        "tools": [
            {
                "type": "web_search_20250305",
                "name": "web_search"
            }
        ]
    }

    try:
        response = requests.post(CLAUDE_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        # ចម្លើយអាចមានច្រើន content blocks (text + tool_use + web_search results)
        # យើងប្រមូលតែផ្នែក text មកបញ្ចូលគ្នា
        text_parts = []
        sources = []

        for block in data.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])
            # web_search_tool_result blocks មាន sources ដែលអាចទាញយកបាន
            if block.get("type") == "web_search_tool_result":
                for item in block.get("content", []):
                    if item.get("type") == "web_search_result":
                        sources.append({
                            "title": item.get("title", ""),
                            "url": item.get("url", "")
                        })

        full_text = "\n".join(text_parts)
        return True, full_text, sources

    except requests.exceptions.RequestException as e:
        return False, f"មានបញ្ហា API: {str(e)}", []


# ==============================================================================
# ឧទាហរណ៍ Flask route (ចម្លងទៅដាក់ក្នុង app.py)
# ==============================================================================
"""
from research_tool import call_claude_with_search  # import ពី file នេះ

@app.route('/api/research', methods=['POST'])
def research():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "សូមផ្តល់ question"}), 400

    success, answer, sources = call_claude_with_search(question)

    if success:
        return jsonify({
            "answer": answer,
            "sources": sources
        })
    else:
        return jsonify({"error": answer}), 502
"""


# ==============================================================================
# លំហាត់អនុវត្ត (ថ្ងៃ 8-10)
# ==============================================================================
"""
ថ្ងៃ 8: សាកល្បង call_claude_with_search() ជាមួយសំណួរសាមញ្ញ
   ឧទាហរណ៍: "តើអាកាសធាតុនៅភ្នំពេញថ្ងៃនេះយ៉ាងណា?"
   សង្កេត: Claude ហៅ web_search ដោយស្វ័យប្រវត្តិ ដោយមិនចាំបាច់ប្រាប់វា

ថ្ងៃ 9: បន្ថែម /api/research endpoint ចូល app.py
   សាកល្បងតាម curl:
   curl -X POST http://127.0.0.1:5000/api/research \\
     -H "Content-Type: application/json" \\
     -d '{"question":"តម្លៃ Bitcoin ថ្ងៃនេះប៉ុន្មាន?"}'

ថ្ងៃ 10: បន្ថែម sources ទៅក្នុង UI (Angular ឬ HTML)
   បង្ហាញតំណភ្ជាប់ប្រភពដែល Claude ស្វែងរកឃើញ ក្រោមចម្លើយ
   នេះជាការអនុវត្ត "Data Literacy" — ជឿលើប្រភព មិនមែនចម្លើយទទេ
"""

