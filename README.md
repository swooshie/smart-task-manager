# Smart Task Manager

A full-stack task management application with intelligent task recommendations, built using Next.js, ASP.NET Core, MongoDB, Redis, and a Python-based ML service.

---

## Overview

Smart Task Manager is designed to go beyond a basic to-do list by integrating a recommendation system that suggests relevant tasks based on user behavior and predefined task patterns.

The system is built with a scalable architecture:
- Frontend: Next.js (React)
- Backend API: ASP.NET Core
- Database: MongoDB
- Caching: Redis (config ready)
- Recommendation Engine: Python (FastAPI + transformer-based similarity)

---

## Features

- JWT-based authentication (Login / Signup)
- Create, edit, delete, and complete tasks
- Task attributes:
  - Title
  - Description
  - Category
  - Priority
  - Due date
- Smart task recommendations using NLP
- Dark-themed UI inspired by modern productivity apps
- RESTful API design
- Modular and scalable architecture

---

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend
- ASP.NET Core Web API
- JWT Authentication
- MongoDB Driver
- HttpClient for microservice communication

### Recommendation Service
- FastAPI
- Sentence Transformers
- Cosine similarity-based recommendations

### Database & Cache
- MongoDB
- Redis (configured, optional for caching layer)

---

## Project Structure

```
smart-task-manager/
│
├── TodoApp.Api/                # ASP.NET Core backend + frontend
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   ├── DTOs/
│   ├── Data/
│   ├── Configuration/
│   ├── todoapp-web/           # Next.js frontend
│
├── recommender-service/       # Python FastAPI service
│   ├── app/
│   │   ├── main.py
│   │   ├── recommender.py
│   │   ├── model.py
│   │   ├── utils.py
│
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/swooshie/smart-task-manager.git
cd smart-task-manager
```

---

## Backend Setup (ASP.NET Core)

```bash
cd TodoApp.Api
dotnet restore
dotnet run
```

Backend will run on:
```
http://localhost:5021
```

---

## Frontend Setup (Next.js)

```bash
cd TodoApp.Api/todoapp-web
npm install
npm run dev
```

Frontend will run on:
```
http://localhost:3000
```

---

## Recommendation Service Setup (Python)

```bash
cd recommender-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Service runs on:
```
http://localhost:8000
```

---

## Environment Configuration

### Backend (`appsettings.json`)

```json
{
  "JwtSettings": {
    "SecretKey": "your_secret_key",
    "Issuer": "TodoApp.Api",
    "Audience": "TodoApp.Client"
  },
  "MongoDbSettings": {
    "ConnectionString": "your_mongo_connection",
    "DatabaseName": "TodoAppDb"
  },
  "RecommendationService": {
    "BaseUrl": "http://localhost:8000"
  }
}
```

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Tasks
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/{id}
- DELETE /api/tasks/{id}

### Recommendations
- POST /api/recommendations

---

## How Recommendations Work

- A large predefined task dataset is embedded using a transformer model
- User tasks are normalized and embedded
- Cosine similarity is used to find closest matching tasks
- Results are returned as suggestions via the backend

---

## Future Improvements

- Redis caching for recommendations
- Task analytics and insights
- Calendar and reminders view
- Drag-and-drop task management
- Mobile responsiveness improvements
- Deployment (Docker + cloud)

---

## Deployment Plan

- Frontend: Vercel
- Backend: Render / Railway / Azure
- Recommendation Service: Docker + Cloud VM
- Database: MongoDB Atlas
- Cache: Redis Cloud

---

## Author

Aditya Jhaveri  
NYU Computer Science Graduate Student  
Software Engineer | Distributed Systems | AI/ML  

GitHub: https://github.com/swooshie  
Portfolio: https://adityajhaveri.com