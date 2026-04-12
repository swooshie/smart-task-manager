from pydantic import BaseModel
from typing import List

class RecommendationRequest(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    userTasks: List[str] = []

class RecommendationResponse(BaseModel):
    suggestions: List[str]