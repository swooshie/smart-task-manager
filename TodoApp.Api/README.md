# TodoApp

A full-stack task management project built to showcase backend, frontend, and applied AI/ML-ready design skills.

The app uses:

- `Next.js` for the frontend
- `ASP.NET Core` with `C#` for the backend API
- `MongoDB` for persistence
- `JWT` for authentication
- a recommendation layer for task suggestions while creating tasks

The current recommendation system is implemented as a lightweight rule-based prototype. It is intentionally structured as a replaceable service so it can later be upgraded to a real ML model, LLM workflow, or external AI inference API.

## Project Goal

This project is designed as a portfolio-ready full-stack application that demonstrates:

- user authentication and authorization
- CRUD operations with a real database
- clean API layering with controllers, services, and repositories
- a modern React/Next.js frontend
- an AI-assisted task creation experience

## Architecture

### Backend

The API is built with ASP.NET Core and follows a layered structure:

- `Controllers/` handles HTTP endpoints
- `Services/` contains business logic
- `Repositories/` manages MongoDB access
- `Data/` contains the MongoDB context
- `Models/` and `DTOs/` define the domain and request/response contracts

### Frontend

The frontend lives in `todoapp-web/` and is built with Next.js App Router. It handles:

- signup and login
- token storage in local storage
- dashboard-based task management
- live suggestion requests while entering a task title and description

## Features

- user signup and login
- JWT-protected task APIs
- create, view, update, complete, and delete tasks
- task metadata support:
  - priority
  - category
  - due date
- personalized dashboard
- live task suggestions during task creation
- MongoDB-based persistence

## Tech Stack

### Backend

- `ASP.NET Core`
- `C#`
- `MongoDB.Driver`
- `BCrypt.Net` for password hashing
- `JWT Bearer Authentication`
- `Swagger` for API testing

### Frontend

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`

### Data / Infra

- `MongoDB`

## Current AI Suggestion Flow

When the user types a task title or description, the frontend calls the recommendation API. The backend recommendation service inspects the input and returns related task suggestions.

Examples:

- entering `milk` can suggest buying bread, eggs, or butter
- entering `interview` can suggest practice tasks
- entering `assignment` or `homework` can suggest smaller next steps

This is a placeholder implementation that demonstrates the product direction and service boundary. A stronger next step would be replacing it with:

- an embeddings-based recommendation pipeline
- a classification/ranking model
- an LLM-backed suggestion service

## Folder Structure

```text
TodoApp.Api/
├── Controllers/
├── Services/
├── Repositories/
├── Models/
├── DTOs/
├── Data/
├── Configuration/
├── Program.cs
├── appsettings.json
└── todoapp-web/
    ├── src/app/
    ├── src/lib/
    └── package.json
```

## API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### Recommendations

- `POST /api/recommendations`

## Local Setup

### Prerequisites

- `.NET 10 SDK` because the API currently targets `net10.0`
- `Node.js`
- `npm`
- `MongoDB` running locally on `mongodb://localhost:27017`

### 1. Start the backend

From the project root:

```bash
dotnet restore
dotnet run
```

By default, the API runs on:

- `http://localhost:5021`
- `https://localhost:7151`

Swagger is available in development mode.

### 2. Start the frontend

In a separate terminal:

```bash
cd todoapp-web
npm install
npm run dev
```

The frontend runs on:

- `http://localhost:3000`

## Configuration

The main API settings are defined in `appsettings.json`.

Important values:

- JWT secret, issuer, and audience
- MongoDB connection string
- MongoDB database and collection names

Default local MongoDB config:

```json
"MongoDbSettings": {
  "ConnectionString": "mongodb://localhost:27017",
  "DatabaseName": "TodoAppDb",
  "UsersCollectionName": "users",
  "TasksCollectionName": "tasks"
}
```

## What This Project Demonstrates

This project is useful for presenting:

- full-stack application development
- API design with authentication
- NoSQL database integration
- frontend and backend integration
- AI/ML product thinking through recommendation features

It is a strong base for extending into:

- real AI-generated task recommendations
- semantic search for tasks
- analytics and productivity insights
- reminder systems
- deployment to cloud infrastructure

## Future Improvements

- replace the placeholder recommendation logic with a real AI/ML service
- add unit and integration tests
- add refresh tokens / stronger auth flows
- add task filtering, search, and pagination
- connect Redis caching properly if caching is introduced
- deploy the frontend and API to production

## Notes

- The frontend currently talks to the API at `http://localhost:5021`
- CORS is configured for `http://localhost:3000`
- The recommendation system is currently heuristic-based, not a trained ML model yet

## License

This project is for learning and portfolio purposes.
