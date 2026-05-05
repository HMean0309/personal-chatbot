<div align="center">

# 🤖 Personal AI Chatbot

A self-hosted AI chatbot with RAG (Retrieval-Augmented Generation), streaming responses, and privacy-first design.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ Features

- **Streaming responses** — tokens stream in real-time via SSE (Server-Sent Events)
- **RAG** — upload PDF/text files, AI answers based on your document content
- **Fallback chain** — Groq (cloud) → LM Studio (local) automatic failover
- **Privacy Mode** — forces local-only inference, no data leaves your machine
- **Dark mode** — toggle and persist across sessions
- **Conversation management** — rename, delete, full-text search
- **Multi-mode** — General, Coding, Docs system prompt presets

---

## 🏗️ Architecture
```text
┌─────────────────────────────────────────────────────────┐
│ Frontend │
│ Next.js 14 (App Router) + Zustand │
└───────────────────────┬─────────────────────────────────┘
│ SSE / REST
┌───────────────────────▼─────────────────────────────────┐
│ Backend │
│ NestJS + Prisma │
│ │
│ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ │
│ │ Use Cases │ │ Providers │ │ RAG Engine │ │
│ │ (Clean │ │ Groq Cloud │ │ pgvector │ │
│ │ Arch) │ │ LM Studio │ │ + Embed │ │
│ └─────────────┘ └──────────────┘ └─────────────┘ │
└───────────────┬─────────────────────────────────────────┘
│
┌───────────────▼──────────────┐
│ PostgreSQL 15 + pgvector │
└──────────────────────────────┘
```


**RAG Flow:**
Upload file → Multer → pdf-parse/text → Chunk (500 words, overlap 50)
→ LM Studio Embed → pgvector store

User message → Embed → vector similarity search (top-5 chunks)
→ Inject into system prompt → Groq / LM Studio → SSE stream


---

## 🚀 Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [LM Studio](https://lmstudio.ai/) — for local inference & RAG embeddings

### 1. Clone the repo

```bash
git clone https://github.com/your-username/personal-ai-chatbot.git
cd personal-ai-chatbot
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Setup Backend

```bash
cd backend
cp .env.example .env   # fill in GROQ_API_KEY and other vars
npm install
npx prisma migrate deploy
npm run start:dev
```

### 4. Setup Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

**Backend `.env`:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) |
| `GROQ_DEFAULT_MODEL` | e.g. `llama-3.3-70b-versatile` |
| `LMSTUDIO_BASE_URL` | LM Studio server URL e.g. `http://localhost:1234/v1` |
| `LMSTUDIO_EMBEDDING_MODEL` | e.g. `text-embedding-nomic-embed-text-v1.5` |
| `EMBEDDING_DIMENSION` | `192` (Matryoshka mode) |
| `FRONTEND_URL` | e.g. `http://localhost:3000` |

**Frontend `.env.local`:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | e.g. `http://localhost:3001/api/chat` |

---

## 🧪 Running Tests

```bash
cd backend
npm run test
```

---

## 🗂️ Project Structure
```text
personal-ai-chatbot/
├── backend/ # NestJS — Clean Architecture
│ └── src/
│   ├── domain/ # Entities, interfaces, exceptions
│   ├── application/ # Use cases
│   ├── infrastructure/# DB, AI adapters
│   └── presentation/ # Controllers, DTOs
├── frontend/ # Next.js 14 App Router
│ └── app/
│   ├── chat/ # Chat pages
│   ├── components/ # UI components
│   ├── hooks/ # useStreamingChat
│   ├── lib/ # API client, types
│   └── store/ # Zustand stores
└── docker-compose.yml
```


---

## 📄 License

MIT