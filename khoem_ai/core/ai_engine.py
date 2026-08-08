#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from groq import Groq

def call_groq(messages):
    """
    Function សម្រាប់ផ្ញើ Chat History/Messages ទៅកាន់ Groq API
    """
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key or "ដាក់_API_KEY" in api_key:
        return False, "Groq API Key មិនទាន់បានកំណត់នៅក្នុង .env ទេ"

    try:
        client = Groq(api_key=api_key)
        
        # ហៅប្រើ Model របស់ Groq (ឧទាហរណ៍៖ llama-3.3-70b-versatile)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        
        answer = response.choices[0].message.content
        return True, answer

    except Exception as e:
        return False, f"Groq Error: {str(e)}"
