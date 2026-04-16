import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import MIN_SCORE, MAX_SUGGESTIONS, USER_BOOST_WEIGHT, CATEGORY_BOOST_WEIGHT, USE_TRANSFORMER
from app.data_loader import load_global_tasks
from app.model_loader import get_model
from app.schemas import RecommendationRequest, RecommendationResponse

GLOBAL_TASKS = load_global_tasks()

def normalize_text(text: str) -> str:
    return " ".join(text.lower().strip().split())

def build_candidates(user_tasks: list[str]):
    combined_candidates = []

    for item in GLOBAL_TASKS:
        combined_candidates.append({
            "task": item["task"],
            "category": item.get("category")
        })
    
    for task in user_tasks:
        combined_candidates.append({
            "task": task,
            "category": None
        })
    seen = set()
    deduped_tasks = []

    for task in combined_candidates:
        normalized = normalize_text(task["task"])
        if normalized not in seen:
            seen.add(normalized)
            deduped_tasks.append(task)
    
    return deduped_tasks

def compute_similarity_transformer(
    query: str,
    candidate_texts: list[str],
    user_tasks_clean: list[str]
):
    model = get_model()
    print("using transformer")

    query_embedding = model.encode([query])
    candidate_embeddings = model.encode(candidate_texts)
    base_similarities = cosine_similarity(query_embedding, candidate_embeddings)[0]
    
    user_task_embeddings = None
    if user_tasks_clean:
        user_task_embeddings = model.encode(user_tasks_clean)
    
    return base_similarities, candidate_embeddings, user_task_embeddings
    
def compute_similarity_tfidf(
    query: str,
    candidate_texts: list[str],
    user_tasks_clean: list[str],
):
    corpus = [query] + candidate_texts
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus)

    query_vector = matrix[0:1]
    candidate_vectors = matrix[1:]

    base_similarities = cosine_similarity(query_vector, candidate_vectors)[0]

    if user_tasks_clean:
        user_corpus = candidate_texts + user_tasks_clean
        user_vectorizer = TfidfVectorizer(stop_words="english")
        user_matrix = user_vectorizer.fit_transform(user_corpus)

        candidate_vectors_for_user = user_matrix[:len(candidate_texts)]
        user_task_vectors = user_matrix[len(candidate_texts):]

        return base_similarities, candidate_vectors_for_user, user_task_vectors

    return base_similarities, candidate_vectors, None
    
def get_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    query = f"{request.title}. {request.description or ''}".strip()
    normalized_query = normalize_text(request.title)
    normalized_category = normalize_text(request.category) if request.category else None

    user_tasks_clean = [
        task.strip()
        for task in request.userTasks
        if task and task.strip()
    ]

    deduped_candidates = build_candidates(user_tasks_clean)
    candidate_texts = [item["task"] for item in deduped_candidates]

    if USE_TRANSFORMER:
        base_similarities, candidate_vectors, user_task_vectors = compute_similarity_transformer(
            query, candidate_texts, user_tasks_clean
        )
    else:
        base_similarities, candidate_vectors, user_task_vectors = compute_similarity_tfidf(
            query, candidate_texts, user_tasks_clean
        )

    scored_candidates = []

    for idx, item in enumerate(deduped_candidates):
        candidate = item["task"]
        candidate_category = item["category"]
        normalized_candidate = normalize_text(candidate)

        if normalized_candidate == normalized_query:
            continue

        base_score = float(base_similarities[idx])
        user_boost = 0.0
        category_boost = 0.0

        if user_task_vectors is not None:
            candidate_vector = candidate_vectors[idx]
            if len(candidate_vector.shape) == 1:
                candidate_vector = candidate_vector.reshape(1, -1)
            else:
                candidate_vector = candidate_vector.reshape(1, -1) if hasattr(candidate_vector, "reshape") else candidate_vector

            user_similarities = cosine_similarity(candidate_vector, user_task_vectors)[0]
            max_user_similarity = float(np.max(user_similarities)) if len(user_similarities) > 0 else 0.0
            user_boost = USER_BOOST_WEIGHT * max_user_similarity

        if normalized_category and candidate_category:
            if normalize_text(candidate_category) == normalized_category:
                category_boost = CATEGORY_BOOST_WEIGHT

        final_score = base_score + user_boost + category_boost

        scored_candidates.append({
            "task": candidate,
            "base_score": base_score,
            "user_boost": user_boost,
            "category_boost": category_boost,
            "final_score": final_score,
        })

    scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

    suggestions = []
    seen_suggestions = set()

    for item in scored_candidates:
        candidate = item["task"]
        normalized_candidate = normalize_text(candidate)

        if item["final_score"] < MIN_SCORE:
            continue

        if normalized_candidate in seen_suggestions:
            continue

        suggestions.append(candidate)
        seen_suggestions.add(normalized_candidate)

        if len(suggestions) == MAX_SUGGESTIONS:
            break

    return RecommendationResponse(suggestions=suggestions)
