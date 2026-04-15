# Smart Task Manager

[Live App](https://smart-task-manager-ashy.vercel.app/)

Smart Task Manager is a full-stack AI-powered task management application inspired by Apple Reminders. It supports authenticated task management, task organization, and intelligent task suggestions powered by a custom recommendation service.

The project is designed as a production-style distributed system rather than a single monolithic app. The frontend, backend, database, cache, and recommendation engine are separated so each part can evolve, scale, and fail independently.

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend

- ASP.NET Core Web API
- .NET 8
- JWT authentication
- Repository and service-layer architecture

### Data Layer

- MongoDB Atlas
- MongoDB C# driver

### Caching

- Redis
- Upstash Redis in production

### Recommendation Service

- Python
- FastAPI
- Scikit-learn
- TF-IDF similarity engine
- Optional transformer-based model, disabled in production for cost and memory reasons

### Deployment

- Vercel for the frontend
- Render for backend services
- cron-job.org for keep-alive pings

## Architecture

Smart Task Manager uses a service-oriented architecture with clear ownership boundaries between user experience, application logic, persistence, caching, and machine learning.

The frontend communicates only with the ASP.NET Core backend. It is responsible for rendering the task interface, managing client-side interaction state, handling optimistic UI updates, and sending authenticated API requests.

The .NET backend is the main application orchestrator. It owns authentication, authorization, task CRUD operations, validation, persistence coordination, cache access, and communication with the recommendation service. Keeping these responsibilities in the backend prevents the frontend from needing direct knowledge of persistence, caching, or ML infrastructure.

MongoDB stores users and task records. A document database fits the task model well because task objects contain flexible metadata such as category, priority, due date, completion state, and optional descriptions.

Redis is used to cache recommendation responses. Recommendation results are derived from task input and user context, so caching reduces repeated ML calls for similar inputs and improves response latency.

The Python FastAPI service owns recommendation logic. The backend sends the current task input and existing user tasks to this service, and the service returns ranked suggestions. Python was chosen for this component because the ML ecosystem is stronger and simpler to iterate on than implementing recommendation logic directly inside the .NET backend.

This architecture was chosen for four main reasons:

- Separation of concerns: UI, business logic, persistence, caching, and ML are isolated.
- Independent scaling: the recommendation service can be scaled, optimized, or replaced without changing the core backend.
- Language flexibility: C# handles API orchestration and authentication, while Python handles ML workflows.
- Production realism: the system models real distributed-service constraints such as latency, retries, cold starts, cache hits, and dependency failures.

## System Flow

1. A user enters a task from the frontend.
2. The Next.js client sends an authenticated request to the backend.
3. The ASP.NET Core backend validates the JWT and extracts the user identity.
4. The backend checks Redis for an existing recommendation response when applicable.
5. On a cache miss, the backend retrieves the user's existing tasks from MongoDB.
6. The backend sends the task input and user task history to the Python recommendation service.
7. The Python service builds a recommendation query from the task title, description, category, and user context.
8. The recommendation engine ranks candidate tasks using TF-IDF similarity, user-task similarity boosts, and category-aware scoring.
9. The Python service returns suggestions to the backend.
10. The backend caches the recommendation response and returns it to the frontend.
11. The frontend renders suggestions without exposing internal service details.

## Recommendation Engine

The recommendation engine uses a lightweight TF-IDF pipeline designed for reliability in constrained deployment environments.

Candidate suggestions come from a predefined task dataset combined with the user's existing tasks. The service normalizes task text, removes duplicates, computes similarity between the new task and candidate tasks, and applies scoring boosts based on user history and category matches.

The final score combines:

- Base TF-IDF similarity between the input task and candidate tasks
- Similarity to the user's existing tasks
- Category match boost
- Minimum score thresholding
- Deduplication
- Maximum suggestion count limiting

A transformer-based model was explored, but it was disabled in production because it introduced slow startups and higher memory usage on free-tier infrastructure. TF-IDF is less semantically powerful than embeddings, but it is fast, deterministic, cheap to run, and reliable for demo and portfolio deployment constraints.

## Key Engineering Challenges

### 1. Cold Starts on Free-Tier Infrastructure

Render free-tier services can go idle after inactivity. When a user visits the app after a period of no traffic, backend services may need to restart before handling requests.

This caused two practical problems:

- Slow first requests
- Temporary gateway failures while services were waking up

For a recruiter-facing demo, this matters because the first impression depends on the app responding consistently.

### 2. ML Service Constraints

The original recommendation approach used a transformer model for semantic similarity. While this improved recommendation quality, it created operational issues in the deployed environment.

The model increased:

- Memory usage
- Startup time
- Dependency size
- Risk of service crashes

On free-tier infrastructure, these costs outweighed the quality improvement. A slower or crashing recommender is worse than a simpler model that responds consistently.

### 3. Distributed System Failures

The backend depends on an external recommendation service. That dependency introduces failure modes that do not exist in a single-process application.

The backend must handle:

- Recommendation service downtime
- Network timeouts
- Slow responses
- Temporary gateway failures
- Invalid or empty responses

The recommendation feature cannot be allowed to break core task management. Task creation, updates, and dashboard usage should continue even when the ML service is unavailable.

## Solutions Implemented

### Keep-Alive Strategy

cron-job.org is used to ping health endpoints every 5 minutes.

This reduces cold starts by keeping deployed services active during demo periods. It is not a replacement for paid always-on infrastructure, but it is a pragmatic solution for a portfolio project deployed on free-tier services.

### Lightweight Recommendation Engine

The production recommender uses TF-IDF instead of transformers.

This improved:

- Startup speed
- Memory usage
- Deployment reliability
- Response consistency
- Cost efficiency

The tradeoff is that TF-IDF captures lexical similarity better than semantic meaning. For this project, reliability and predictable performance were prioritized over deeper semantic matching.

### Retry Mechanism

The backend retries failed recommendation requests for transient failures.

Retries are useful for temporary service wake-ups, gateway errors, and short outages. The retry logic is intentionally scoped to recommendation requests so the system does not retry every backend operation blindly.

### Redis Caching

Recommendation responses are cached using Redis.

Caching reduces repeated calls to the ML service for similar task inputs. This lowers latency and decreases the chance that users experience slow responses from the recommender during repeated interactions.

### Optimistic UI Updates

The frontend uses optimistic updates for task interactions where appropriate.

Instead of waiting for every backend confirmation before updating the interface, the UI reflects user intent immediately and reconciles with the backend response. This improves perceived performance while keeping the backend as the source of truth.

### Fallback Strategy

If recommendation generation fails, the system returns an empty or default-safe response rather than surfacing a broken state to the user.

The core task workflow remains usable even when the recommendation service is slow, unavailable, or returning errors.

## Features

- JWT-based signup and login
- Authenticated task CRUD operations
- Task completion tracking
- Task categories
- Task priorities
- Due dates
- AI-powered task suggestions
- User-history-aware recommendations
- Recommendation caching
- Filtering and sorting
- Smooth UI animations and transitions
- Dark mode interface
- Optimistic UI behavior
- Resilient backend-to-service communication
- Graceful fallback when recommendations fail

## Project Structure

```text
smart-task-manager/
├── TodoApp.Api/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   ├── DTOs/
│   ├── Data/
│   ├── Configuration/
│   └── todoapp-web/
│       ├── src/app/
│       ├── src/components/
│       └── src/lib/
├── recommender-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── recommender.py
│   │   ├── schemas.py
│   │   ├── config.py
│   │   └── data_loader.py
│   └── requirements.txt
└── README.md
```

## Running Locally

### Frontend

```bash
cd TodoApp.Api/todoapp-web
npm install
npm run dev
```

### Backend

```bash
cd TodoApp.Api
dotnet restore
dotnet run
```

### Recommendation Service

```bash
cd recommender-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

### Backend

```text
JwtSettings__SecretKey
MongoDbSettings__ConnectionString
RedisSettings__ConnectionString
RecommendationService__BaseUrl
```

### Frontend

```text
NEXT_PUBLIC_API_BASE_URL
```

### Python Recommendation Service

```text
USE_TRANSFORMER=false
```

## Design Tradeoffs

### Microservices vs. Monolith

A monolith would be simpler to deploy and debug, but separating the recommendation service makes the system more realistic and flexible. The ML service can be replaced with embeddings, vector search, or a managed model endpoint without rewriting authentication or task CRUD logic.

### TF-IDF vs. Transformers

Transformers provide better semantic understanding, but they were too expensive for the target deployment environment. TF-IDF was selected because it gives acceptable recommendation quality with much lower operational risk.

### Redis Cache vs. Direct ML Calls

Calling the recommender for every request is simpler, but it increases latency and dependency pressure. Redis adds infrastructure complexity, but it improves responsiveness and reduces repeated work.

### Optimistic UI vs. Strict Server Confirmation

Strict confirmation is simpler from a consistency perspective, but it makes the interface feel slower. Optimistic updates improve UX, with backend responses still acting as the final source of truth.

## Future Improvements

- Replace TF-IDF with embedding-based search
- Add vector storage for semantic task retrieval
- Add real-time updates
- Improve personalization using user behavior
- Add recurring tasks and reminders
- Add mobile-first interaction improvements
- Add observability for service latency and recommendation failures
- Add integration tests across frontend, backend, and recommender boundaries
- Add rate limiting and stronger production security controls

## Summary

Smart Task Manager demonstrates a production-oriented full-stack system with authentication, persistent storage, caching, distributed service communication, and a practical ML recommendation pipeline.

The main engineering focus is not just building task CRUD, but handling the real constraints that appear when deploying a multi-service application: cold starts, memory limits, network failures, latency, caching, and graceful degradation.
