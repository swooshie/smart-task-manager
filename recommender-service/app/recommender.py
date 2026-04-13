import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.config import MIN_SCORE, MAX_SUGGESTIONS, USER_BOOST_WEIGHT, CATEGORY_BOOST_WEIGHT
from app.data_loader import load_global_tasks, extract_task_texts
from app.model_loader import get_model
from app.schemas import RecommendationRequest, RecommendationResponse

GLOBAL_TASKS = load_global_tasks()

def normalize_text(text: str) -> str:
    return " ".join(text.lower().strip().split())

def get_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    query = f"{request.title}. {request.description or ''}".strip()
    normalized_query = normalize_text(query)
    normalized_category = normalize_text(request.category) if request.category else None
    model = get_model()
    query_embedding = model.encode([query])

    user_tasks_clean = [task.strip() for task in request.userTasks if task and task.strip()]

    combined_tasks = []

    for item in GLOBAL_TASKS:
        combined_tasks.append({
            "task": item["task"],
            "category": item.get("category", "").strip()
        })
    
    for task in user_tasks_clean:
        combined_tasks.append({
            "task": task,
            "category": None
        })

    seen = set()
    deduped_tasks = []

    for task in combined_tasks:
        normalized = normalize_text(task["task"])
        if normalized not in seen:
            seen.add(normalized)
            deduped_tasks.append(task)

    
    task_texts = [item["task"] for item in deduped_tasks] 
    model = get_model() 
    task_embeddings = model.encode(task_texts)

    similarities = cosine_similarity(query_embedding, task_embeddings)[0]

    # User history boost
    user_task_embeddings = None
    if user_tasks_clean:
        model = get_model()
        user_task_embeddings = model.encode(user_tasks_clean)
    
    scored_tasks = []
    for idx, task in enumerate(deduped_tasks):
        candidate = task["task"]
        normalized_task = normalize_text(candidate)
        task_category = task["category"].strip() if task["category"] else None

        if normalized_task == normalized_query:
            continue

        base_score = float(similarities[idx])
        user_boost = 0.0
        category_boost = 0.0

        if user_task_embeddings is not None:
            task_embedding = task_embeddings[idx].reshape(1, -1)
            user_similarities = cosine_similarity(task_embedding, user_task_embeddings)[0]
            max_user_similarity = float(np.max(user_similarities)) if user_similarities.size > 0 else 0.0
            user_boost = USER_BOOST_WEIGHT * max_user_similarity

        if normalized_category and task_category:
            if(normalize_text(task_category) == normalized_category):
                category_boost = CATEGORY_BOOST_WEIGHT
        
        final_score = base_score + user_boost + category_boost
        scored_tasks.append({
            "task": candidate,
            "base_score": base_score,
            "user_boost": user_boost,
            "category_boost": category_boost,
            "final_score": final_score
        })
    
    scored_tasks.sort(key=lambda x: x["final_score"], reverse=True)
    
    suggestions = []
    seen = set()

    for item in scored_tasks:
        candidate = item["task"]
        normalized_candidate = normalize_text(candidate)

        if item["final_score"] < MIN_SCORE:
            continue

        if normalized_candidate in seen:
            continue
        seen.add(normalized_candidate)
        suggestions.append(candidate)
        if len(suggestions) >= 5:
            break

    return RecommendationResponse(suggestions=suggestions)
