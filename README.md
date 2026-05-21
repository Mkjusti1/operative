# Streaming Agentic Task Runner

A multi-agent system where an AI plans, executes, and streams complex tasks live to the browser.

## Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS → Vercel
- **Backend**: Node.js, Express, BullMQ → Render
- **Queue**: Redis (Upstash recommended)
- **Database + Auth**: Supabase (PostgreSQL + Google OAuth)
- **LLM**: Anthropic Claude (claude-sonnet-4)

---

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Run `backend/supabase/schema.sql` in the SQL editor
3. Enable Google OAuth under Authentication → Providers
4. Copy your project URL and keys

### 2. Redis
Use [Upstash](https://upstash.com) for a free managed Redis instance.
Copy the `REDIS_URL` from the Upstash console.

### 3. Backend
```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev            # API server on :4000

# In a separate terminal:
npm run worker         # BullMQ worker
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env.local   # fill in your keys
npm install
npm run dev                  # Next.js on :3000
```

---

## Architecture

```
User types goal
  → POST /api/tasks           (Express)
  → taskQueue.add()           (BullMQ → Redis)
  → Worker picks up job
      → planTask()            (Planner Agent → Claude)
      → runDAG()              (DAG Scheduler)
          → executeSubtask()  (Executor Agent × N, parallel)
              → runTool()     (web_search | web_fetch | code_runner | file_writer)
      → synthesize()          (Synthesizer Agent → Claude, streaming)
  → Every step: persistEvent() → Supabase Realtime → SSE → Frontend
```

## Deployment

### Render (Backend)
- Create two services from the same repo:
  - **Web Service**: `npm start` (Express API)
  - **Background Worker**: `npm run worker` (BullMQ worker)
- Set all env vars from `.env.example`

### Vercel (Frontend)
- Import the `frontend/` folder
- Set `NEXT_PUBLIC_API_URL` to your Render backend URL
- Set Supabase public vars
