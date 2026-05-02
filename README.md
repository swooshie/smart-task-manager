# Smart Task Manager

![CI](https://github.com/swooshie/smart-task-manager/actions/workflows/ci.yaml/badge.svg)

[Live App](https://smart-task-manager-ashy.vercel.app/)

Smart Task Manager is a full-stack productivity application that combines task management, AI-assisted suggestions, and a location-aware messaging workflow.

The project started as a distributed task manager with a `Next.js` frontend, `ASP.NET Core` backend, `MongoDB`, `Redis`, and a Python recommendation service. It was then extended for a Linq technical assessment into a context-aware assistant where iMessage acts as the action layer for tasks.

The result is a system where users can:

- manage tasks in the web app
- interact with tasks through Linq-powered messaging
- receive location-aware reminders when they are near a relevant saved place
- complete or snooze those reminders directly from the chat thread

## What It Demonstrates

- full-stack application development
- distributed backend architecture
- JWT authentication and protected APIs
- microservice integration
- applied ML recommendations
- webhook-based messaging workflows
- location-aware reminder decisioning
- product-focused UX thinking under real platform constraints

## Current Product Story

The web app is the control surface.
Messaging is the low-friction action surface.

Example flow:

1. A user creates a task like `Groceries` with category `groceries`
2. The user links their phone number to a Linq sandbox line
3. The user saves a place like `Trader Joe's`
4. A location event indicates the user is near that place
5. The backend decides whether the reminder is relevant
6. The user receives a message such as:
   `You're near Trader Joe's and still have "Groceries" open. Reply DONE, SNOOZE 30, or LIST.`
7. The user replies from the thread
8. The task is updated in the app

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Leaflet + OpenStreetMap for saved-place selection

### Backend

- ASP.NET Core Web API
- .NET 10
- JWT authentication
- service + repository architecture
- Linq webhook and messaging integration

### Data Layer

- MongoDB
- MongoDB C# driver

### Caching

- Redis
- recommendation caching
- temporary reminder context + snooze state

### Recommendation Service

- Python
- FastAPI
- scikit-learn
- TF-IDF similarity engine

## Core Features

### Task Management

- signup and login with JWT auth
- authenticated task CRUD
- priorities
- categories
- due dates
- completion tracking
- filtering and sorting

### AI Assistance

- live task suggestions while typing
- recommendation scoring based on input and user task history
- Redis caching for repeated recommendation requests
- graceful fallback when the recommender is unavailable

### Messaging Workflow

- phone number linking to a Linq sandbox line
- inbound-first chat flow
- webhook-driven message handling
- text commands:
  - `HELP`
  - `LIST`
  - `ADD <task>`
  - `DONE <number>`
  - `DELETE <number>`
  - `DONE`
  - `SNOOZE 30`

### Location Awareness

- saved places with categories and radius
- current-location capture from the browser
- map-based place search using OpenStreetMap
- click-to-pin place selection on a map
- simulated arrival events for demo/testing
- contextual reminder sending only when place + task match strongly enough

## Architecture

Smart Task Manager uses a service-oriented architecture with clear ownership boundaries.

### Next.js Frontend

Responsible for:

- auth flows
- dashboard UX
- task interactions
- messaging setup
- saved-place setup
- current-location and map-assisted place selection
- simulated location events for the demo

### ASP.NET Core Backend

Responsible for:

- authentication and authorization
- task CRUD
- MongoDB access
- Redis caching
- recommendation orchestration
- Linq webhook ingestion
- inbound command parsing
- outbound message sending
- location-aware reminder decisioning

### Python Recommendation Service

Responsible for:

- suggestion generation
- TF-IDF ranking
- combining task input with user task history

## Messaging and Location Flow

### Inbound Messaging

1. User sends a message to the Linq sandbox number
2. Linq sends a webhook to the backend
3. Backend maps the phone number to the app user
4. Backend parses the command
5. Backend sends a reply into the same chat thread

### Contextual Reminder Flow

1. User saves a place tied to a task category
2. A location event is received
3. Backend checks whether the user is inside a saved place radius
4. Backend ranks open tasks against that place context
5. Backend sends a single high-signal reminder if a match is strong enough
6. User can reply `DONE` or `SNOOZE 30`

## Why `Simulate arrival` Exists

For the Linq assessment, the system uses a manual `Simulate arrival` trigger in the dashboard.

That is a demo trigger, not the intended long-term UX.

It exists so the same backend workflow can be demonstrated reliably without needing a native mobile app or background GPS pipeline during the assessment.

In a real product, the location event would be generated automatically from a real client location update.

## Project Structure

```text
smart-task-manager/
├── TodoApp.Api/
│   ├── Configuration/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Models/
│   ├── Repositories/
│   ├── Services/
│   └── todoapp-web/
│       ├── src/app/
│       ├── src/components/
│       └── src/lib/
├── recommender-service/
│   ├── app/
│   └── requirements.txt
├── agent_docs/
└── README.md
```

## Running Locally

### 1. Start the Backend

```bash
cd TodoApp.Api
dotnet restore
dotnet run
```

Backend runs on:

- `http://localhost:5021`

### 2. Start the Frontend

```bash
cd TodoApp.Api/todoapp-web
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:3000`

### 3. Start the Recommendation Service

```bash
cd recommender-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Recommendation service runs on:

- `http://localhost:8000`

## Linq Setup

The Linq integration expects:

- a Linq API key
- a sandbox sender number
- a public webhook URL pointing to:
  - `/api/linq/webhook`

Recommended local secret file:

- `TodoApp.Api/appsettings.Secrets.json`

Example:

```json
{
  "Linq": {
    "ApiKey": "YOUR_API_KEY",
    "DefaultFromPhoneNumber": "+13214298512",
    "WebhookSecret": "OPTIONAL_WEBHOOK_SECRET"
  }
}
```

To test inbound messaging locally, expose the backend with a tunnel such as `ngrok` and register:

```text
https://your-public-url/api/linq/webhook
```

The key event required for the app is:

- `message.received`

## Environment Variables

### Backend

```text
JwtSettings__SecretKey
MongoDbSettings__ConnectionString
RedisSettings__ConnectionString
RecommendationService__BaseUrl
Linq__ApiKey
Linq__DefaultFromPhoneNumber
Linq__WebhookSecret
```

### Frontend

```text
NEXT_PUBLIC_API_BASE_URL
```

### Python Recommendation Service

```text
USE_TRANSFORMER=false
```

## Assessment Demo Flow

Recommended flow:

1. Open the dashboard
2. Show that the phone is linked and messaging is live
3. Show a task with a meaningful category
4. Show a saved place selected from the map or current location
5. Send `LIST` from the phone
6. Trigger `Simulate arrival`
7. Show the location-aware reminder message
8. Reply `DONE`
9. Refresh the dashboard and show the task completed

## Design Tradeoffs

### Linq Instead of Building a Native Messaging Client

Linq made it possible to focus on workflow design, webhook handling, and contextual reminders without building an entire messaging transport from scratch.

### Simulated Location Instead of Full Background Tracking

For the assessment, reliability and demo clarity mattered more than building a native mobile location pipeline in limited time.

### TF-IDF Instead of Heavier ML Models

TF-IDF is cheaper, faster, and more reliable in constrained environments than transformer-based models for this project.

### Category-Based Place Matching

Using task categories for place association makes the reminder signal more deterministic and easier to reason about than trying to infer everything from raw text alone.

## Future Improvements

- real location-event ingestion instead of manual simulation
- native mobile or PWA workflow for better background location support
- Telegram or another free long-term messaging channel after Linq sandbox expiry
- better reminder ranking and throttling
- recent activity / reminder history panel
- stronger test coverage
- cleanup of remaining nullable warnings in the .NET codebase

## Summary

Smart Task Manager is no longer just a CRUD todo app with suggestions.

It is a full-stack, distributed, context-aware productivity system that combines:

- task management
- AI-assisted suggestions
- webhook-based chat interactions
- location-aware reminder logic

The strongest part of the project is not a single feature. It is the way the pieces work together across frontend UX, backend orchestration, external messaging, caching, and applied recommendation logic.
