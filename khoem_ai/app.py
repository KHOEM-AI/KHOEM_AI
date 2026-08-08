#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "khoem_secret")

from routes.chat_routes import chat_bp
app.register_blueprint(chat_bp)

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    port = int(os.getenv("SERVER_PORT", 5000))
    print(f"🚀 KHOEM AI Server is running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
