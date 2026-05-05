# Smart Task Manager

![CI](https://github.com/swooshie/smart-task-manager/actions/workflows/ci.yaml/badge.svg)

[Live App](https://smart-task-manager-ashy.vercel.app/)

Smart Task Manager is a full-stack productivity app with AI suggestions, task-linked places, and chat-based task actions. The current product uses a `Next.js` frontend, an `ASP.NET Core` API, `MongoDB`, `Redis`, and a Python recommendation service. Messaging is Telegram-first, with Linq retained as an optional text-based fallback.

## Overview

The app is built around a simple idea:

- manage tasks in the web app
- optionally link a task to a place
- keep messaging connected for quick actions
- let the app send a contextual reminder when you are near that place
- complete or snooze that task from chat

This keeps the web app as the control surface and messaging as the action surface.

## Core Features

### Tasks

- JWT-based auth
- task CRUD
- priorities, categories, due dates
- active/completed task views
- filtering and sorting

### AI Suggestions

- live task suggestions while typing
- Python recommendation service using TF-IDF similarity
- Redis-backed caching
- graceful fallback if the recommender is unavailable

### Places

- reusable saved places
- browser current-location capture
- OpenStreetMap search
- click-to-pin map selection
- optional place category metadata

### Location-Aware Reminders

- tasks can be linked directly to a saved place
- reminders are triggered only for tasks linked to the nearby place
- multiple linked tasks at the same place are grouped into one reminder
- supports `DONE <number>`, `DONE ALL`, `SNOOZE 30`, and `LIST`

### Messaging

- Telegram bot as the primary free channel
- Linq-supported text/iMessage-style fallback
- inbound command handling
- outbound reminder sending
- explicit provider-specific failure messages when Telegram or Linq is unavailable

## Product Flow

1. Link messaging in the app.
2. Create a place such as `Office` or `Trader Joe's`.
3. Create a task and enable `Location`.
4. Attach that task to the saved place.
5. Keep the dashboard open.
6. The app checks location periodically while active.
7. When you are near the linked place, a reminder is sent through chat.
8. Reply from chat to complete or snooze the task.

## Messaging Commands

- `HELP`
- `LIST`
- `ADD <task>`
- `DONE`
- `DONE <number>`
- `DONE ALL`
- `DELETE <number>`
- `SNOOZE 30`

## How Location Works

This version is web-first.

- the app checks location while the dashboard is open and visible
- it currently checks every 30 seconds
- if the page is inactive or closed, those checks stop

That is an intentional browser constraint. True background geofencing would require a native mobile app or deeper mobile platform support.

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Leaflet
- OpenStreetMap / Nominatim

### Backend

- ASP.NET Core Web API
- .NET 10
- JWT auth
- service + repository architecture
- Telegram webhook integration
- Linq webhook integration

### Data and Caching

- MongoDB
- Redis

### Recommendation Service

- Python
- FastAPI
- scikit-learn

## Architecture

### Frontend

Responsible for:

- auth flows
- task creation and editing
- place creation and editing
- messaging setup
- active location reporting while the app is open

### API

Responsible for:

- auth and protected APIs
- task and place persistence
- reminder decisioning
- message dispatch
- Telegram and Linq webhook handling
- temporary reminder context and snooze state

### Recommendation Service

Responsible for:

- generating suggestion candidates
- ranking likely follow-up tasks

## Project Structure

```text
smart-task-manager/
├── TodoApp.Api/
│   ├── Configuration/
│   ├── Controllers/
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
└── README.md
```

## Run Locally

### 1. Backend

```bash
cd TodoApp.Api
dotnet restore
dotnet run
```

Runs on `http://localhost:5021`

### 2. Frontend

```bash
cd TodoApp.Api/todoapp-web
npm install
npm run dev
```

Runs on `http://localhost:3000`

### 3. Recommendation Service

```bash
cd recommender-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Runs on `http://localhost:8000`

## Telegram Setup

Create a bot with BotFather and configure:

- `Telegram:BotToken`
- `Telegram:BotUsername`
- optional `Telegram:WebhookSecret`

Then expose the API publicly and point Telegram to:

```text
POST /api/telegram/webhook
```

Users link their Telegram username in the app, open the bot, and send `HELP` once to establish the thread.

## Linq Setup

Linq is optional in the current product and mainly useful as a legacy text-based path.

Configure:

- `Linq:ApiKey`
- `Linq:DefaultFromPhoneNumber`
- optional `Linq:WebhookSecret`

Expose the API publicly and point Linq to:

```text
POST /api/linq/webhook
```

## Build Checks

From the frontend project:

```bash
npm run lint
npm run build
```

From the backend project:

```bash
dotnet build
```

These are the same checks most likely to catch CI issues before pushing.
