from fastapi import FastAPI
from app.config import USE_TRANSFORMER
from app.schemas import RecommendationRequest, RecommendationResponse
from app.recommender import get_recommendations

print(f"Recommender mode: {'TRANSFORMER' if USE_TRANSFORMER else 'TF-IDF'}")

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest):
    return get_recommendations(request)