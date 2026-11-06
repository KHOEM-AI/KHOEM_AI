from pathlib import Path
import json

CONFIG_PATH = Path(__file__).resolve().parent / "config.json"

def load():
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
