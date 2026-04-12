from sentence_transformers import SentenceTransformer
from app.config import MODEL_NAME

model = SentenceTransformer(MODEL_NAME)