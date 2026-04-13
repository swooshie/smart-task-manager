from app.config import MODEL_NAME, USE_TRANSFORMER

_model = None

def get_model():
    global _model
    if not USE_TRANSFORMER:
        return None
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model