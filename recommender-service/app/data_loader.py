import json
from app.config import TASKS_FILE

def load_global_tasks():
    with open(TASKS_FILE) as f:
        return json.load(f)

def extract_task_texts(tasks: list[dict]) -> list[str]:
    return [item["task"] for item in tasks]