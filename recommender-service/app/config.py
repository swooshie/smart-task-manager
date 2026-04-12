from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TASKS_FILE = BASE_DIR / "tasks.json"

MODEL_NAME = 'all-MiniLM-L6-v2'
MIN_SCORE = 0.35
MAX_SUGGESTIONS = 5
USER_BOOST_WEIGHT = 0.15
CATEGORY_BOOST_WEIGHT = 0.1