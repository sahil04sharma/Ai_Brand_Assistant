# AI Brand Assistant

## 1. Project Overview

AI Brand Assistant is a multi-brand chat backend (with a React UI) that helps users iteratively develop brand concepts — **name**, **tagline**, **target audience**, **tone**, and **keywords** — using an LLM (Groq).

Each brand keeps its own isolated conversation history and structured state. Switching brands loads only that brand’s context; there is no cross-brand leakage.

**Key features implemented:**

- Create and list multiple brands
- Per-brand chat via Groq (`llama-3.3-70b-versatile`)
- Structured brand state that evolves with each message
- Isolated context (messages + state embedded in each Brand document)
- Minimal UI: brand dropdown, chat window, live state panel, how-to guide
- REST API: `POST/GET /brands`, `GET /brands/:id`, `POST /chat`

## 2. Tech Stack

| Layer | Choice |
| --- | --- |
| Backend | Node.js, Express (ES modules) |
| Database | MongoDB Atlas via Mongoose |
| LLM | Groq API (`llama-3.3-70b-versatile`) |
| Frontend | React + Vite + Tailwind CSS |
| Env config | `dotenv` |

**Storage method:** MongoDB (not in-memory). Brands, structured state, and message history are persisted in Atlas.

## 3. Architecture Overview

### Request flow (chat)

```
Client → Express Route (/chat)
      → chatController
      → contextService (builds prompt from brand.state + last 4 messages)
      → llmService (calls Groq, parses structured JSON, retries once on failure)
      → merge state into Brand.state + append Brand.messages
      → save to MongoDB
      → respond { "response": "..." }
```

### Context storage & retrieval

- One MongoDB collection: `brands`
- Each document holds:
  - `name` — user label for the workspace (e.g. “Fitness Brand”)
  - `state` — structured fields (`brandName`, `tagline`, `targetAudience`, `tone`, `keywords`)
  - `messages` — full chat history (`user` / `assistant`)
- Loading a brand is a single `findById`; messages never live in a shared/global store

### LLM integration

- `contextService` builds a system + user prompt with current state and recent messages
- `llmService` requests JSON (`response_format: json_object`), validates required fields, retries once, then falls back safely if parsing still fails
- Controller merges non-empty state fields so blanks from the model never wipe prior values

## 4. Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB Atlas connection string
- Groq API key ([console.groq.com](https://console.groq.com))

### Clone and install

```bash
git clone https://github.com/sahil04sharma/Ai_Brand_Assistant.git
cd Ai_Brand_Assistant
```

**Server:**

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your real values
npm run dev
```

**Client** (new terminal):

```bash
cd client
npm install
cp .env.example .env
# Local: leave VITE_API_URL empty (Vite proxy handles /brands and /chat)
npm run dev
```

- API: `http://localhost:5000`
- UI: `http://localhost:5173` (Vite proxies `/brands` and `/chat` to the API when `VITE_API_URL` is empty)

### Environment variables

**Server (`server/.env`):**

| Variable | Description |
| --- | --- |
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Groq API key for LLM calls |
| `CLIENT_ORIGIN` | Optional. Deployed frontend URL for CORS (e.g. `https://your-app.vercel.app`). If unset, any origin is allowed. |

**Client (`client/.env`):**

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend base URL for production builds. **Leave empty locally** so the Vite proxy is used. Example for deploy: `https://your-api.onrender.com` |

Example server `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai-brand-assistant?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_api_key_here
CLIENT_ORIGIN=
```

Example client `.env` (local):

```env
VITE_API_URL=
```

### Deploy note (avoid CORS / wrong API host)

If the UI and API are on **different domains**:

1. Set `VITE_API_URL` to your API URL **at build time** (Vite bakes it into the bundle).
2. Optionally set server `CLIENT_ORIGIN` to your frontend URL.
3. Server already enables CORS so browser requests from the UI origin are allowed.
## 5. How to Use

### UI

1. Open `http://localhost:5173`
2. Create a brand (e.g. “Fitness Brand”) or select one from the dropdown
3. Chat — e.g. “I want a fitness brand”, then “Make it more premium”
4. Watch the **Brand state** panel update after each reply
5. Switch brands in the dropdown to load that brand’s own chat and state

### API (cURL)

Base URL: `http://localhost:5000`

#### Create brand — `POST /brands`

```bash
curl -X POST http://localhost:5000/brands \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Fitness Brand\"}"
```

#### List brands — `GET /brands`

```bash
curl http://localhost:5000/brands
```

#### Get brand context — `GET /brands/:id`

```bash
curl http://localhost:5000/brands/<BRAND_ID>
```

#### Chat — `POST /chat`

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d "{\"brand_id\": \"<BRAND_ID>\", \"message\": \"I want a fitness brand\"}"
```

Follow-up (same brand — context continues):

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d "{\"brand_id\": \"<BRAND_ID>\", \"message\": \"Make it more premium\"}"
```

**Switch brand:** use a different `brand_id` in `/chat` (or select another brand in the UI). Each ID loads only that brand’s messages and state.

### Health check

```bash
curl http://localhost:5000/health
```

## 6. Design Decisions

- **MongoDB database instead of in-memory** — In-memory would be simpler, but all brands and chat context would disappear on every server restart, which breaks demos and makes multi-session testing unreliable. A database keeps brands, structured state, and message history durable across restarts so context truly persists. MongoDB Atlas also matches the document shape of our data (per-brand `state` + `messages` array) without extra tables or joins.
- **MongoDB over a relational DB** — Brand context is naturally a semi-structured document. Embedding state and messages in one Brand document avoids joins and was faster to set up for a time-boxed assignment than managed Postgres.
- **Structured state as source of truth** — `state` captures what the brand has become so far. Evolution and isolation are visible in the StatePanel (and Loom demo), not only inferred from chat transcripts.
- **Messages still stored** — Recent messages feed conversational tone into the next prompt and provide a full audit trail.
- **Isolation by construction** — Messages and state live inside each Brand document, so querying one brand cannot touch another brand’s data.
- **Prompt + merge strategy** — The model must return concrete `brandName` / `tagline` / `targetAudience`; the server skips empty overwrites so a bad parse cannot erase good state.

## 7. Limitations

- No authentication / user accounts (single-tenant assumption)
- No rate limiting on API or Groq calls
- No streaming responses
- No caching layer
- Long chat histories are not summarized — only the last 4 messages plus full structured state are sent to the LLM (older message nuance may fade)
- LLM output can occasionally be imperfect; one retry + fallback mitigates but does not eliminate that
- Frontend depends on the API running locally (or a matching proxy target)

## 8. Future Improvements

- Context summarization for long conversations
- Caching repeated / similar requests
- Streaming responses via SSE
- Multi-user auth and per-user brand ownership
- Stronger JSON repair / retry for malformed LLM output
- Production deployment (hosted API + UI) and request rate limits

---

## Loom Video

> **TODO:** Add your Loom walkthrough link here after recording (5–10 minutes: approach, architecture, per-brand context, live demo of two isolated brands, trade-offs).

**Loom link:** https://www.loom.com/share/c7489d35bdc94b8d977a6504d2cb7dba

---

## Assignment checklist

| Deliverable | Status |
| --- | --- |
| Working backend (4 endpoints) | Done |
| Working frontend (dropdown, chat, state panel) | Done |
| README (8 required sections) | Done |
| cURL examples for every endpoint | Done |
| Loom video link in README | Pending (add above) |
| Public GitHub repo | Done (if pushed) |
| Email repo link to info@rohangirdhani.com | Pending (you) |
