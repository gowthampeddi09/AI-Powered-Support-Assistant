# AI-Powered Support Assistant

A full-stack AI support chatbot that answers user questions based on provided product documentation. Built with React, Node.js/Express, SQLite, and Google Gemini via OpenRouter.

## Architecture

```
frontend/ (React + Vite)        backend/ (Node.js + Express)
     |                               |
     |--- /api/chat POST ---------> chat route -> LLM service -> OpenRouter API
     |--- /api/chat/:id GET ------> chat route -> SQLite
     |--- /api/sessions GET ------> sessions route -> SQLite
```

The assistant strictly answers from `docs.json` only. If a question falls outside the documentation, it responds with a refusal message. Conversation context (last 5 user-assistant pairs) is retrieved from SQLite for each request.

## Tech Stack

- **Frontend**: React 18, Vite, react-markdown
- **Backend**: Node.js, Express, better-sqlite3
- **LLM**: Google Gemini 2.0 Flash via OpenRouter API
- **Database**: SQLite (file-based, zero configuration)

## Setup

### Prerequisites

- Node.js 18 or later
- An OpenRouter API key (get one at https://openrouter.ai)

### Backend

```bash
cd backend
cp .env.example .env
# Add your OpenRouter API key to the .env file
npm install
npm start
```

The server starts on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies API requests to the backend.

## API Documentation

### POST /api/chat

Send a message and receive an AI response.

**Request body:**
```json
{
  "sessionId": "string (UUID)",
  "message": "string"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "reply": "string"
}
```

**Errors:**
- `400` - Missing or invalid `sessionId` or `message`
- `429` - Rate limit exceeded (30 requests per minute per IP)
- `500` - Internal server error or LLM API failure

### GET /api/chat/:sessionId

Retrieve all messages for a given session.

**Response:**
```json
{
  "sessionId": "string",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "string",
      "created_at": "datetime"
    }
  ]
}
```

### GET /api/sessions

List all sessions ordered by most recently updated.

**Response:**
```json
{
  "sessions": [
    {
      "id": "string",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### GET /api/health

Health check endpoint. Returns `{ "status": "ok" }`.

## SQLite Schema

### sessions

| Column     | Type     | Notes           |
|------------|----------|-----------------|
| id         | TEXT     | Primary key (UUID) |
| created_at | DATETIME | Auto-set on creation |
| updated_at | DATETIME | Updated on each message |

### messages

| Column     | Type    | Notes                    |
|------------|---------|--------------------------|
| id         | INTEGER | Primary key, autoincrement |
| session_id | TEXT    | Foreign key to sessions  |
| role       | TEXT    | "user" or "assistant"    |
| content    | TEXT    | Message text             |
| created_at | DATETIME | Auto-set on creation    |

## How It Works

1. The frontend generates a UUID-based session ID on first load and stores it in localStorage.
2. When the user sends a message, the frontend calls `POST /api/chat` with the session ID and message text.
3. The backend creates the session if it does not exist, stores the user message in SQLite, and fetches the last 5 conversation pairs for context.
4. A prompt is constructed with the product documentation from `docs.json`, the recent chat history, and the current question. The system prompt instructs the model to answer only from the documentation.
5. The prompt is sent to Google Gemini 2.0 Flash through the OpenRouter API.
6. The assistant response is stored in SQLite and returned to the frontend.
7. The frontend renders the response with markdown formatting.

## Assumptions

- The product documentation in `docs.json` is static and loaded at server startup.
- Session IDs are generated client-side using `crypto.randomUUID()`.
- Rate limiting is applied per IP address at 30 requests per minute.
- The LLM model used is `google/gemini-2.0-flash-exp:free` via OpenRouter.
- The SQLite database file is created automatically in the backend directory.
- All timestamps are stored in UTC.

## Environment Variables

| Variable          | Description                     | Required |
|-------------------|---------------------------------|----------|
| OPENROUTER_API_KEY | API key for OpenRouter          | Yes      |
| PORT              | Backend server port (default: 3001) | No   |
