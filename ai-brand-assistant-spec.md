# AI Brand Assistant — Build Spec

Give this entire file to Cursor as context/instructions. Build exactly this.

## Project Summary

Build a backend service (Node.js + Express) for an AI-powered brand assistant.
Users create multiple "brands," chat with an LLM (Groq) to iteratively develop
each brand's name/tagline/target audience/tone, and each brand keeps its own
fully isolated conversation context. Include a minimal React (Vite) frontend:
brand dropdown + chat window + live state panel showing the brand's current
structured state (proves context evolves and stays isolated per brand).

## Tech Stack

- Backend: Node.js, Express, Mongoose, MongoDB Atlas
- LLM: Groq API (model: llama-3.3-70b-versatile or similar current Groq model)
- Frontend: React + Vite, plain CSS (no heavy UI library needed)
- Env vars: `MONGO_URI`, `GROQ_API_KEY`, `PORT`

## Data Model

Single collection: `brands`

```js
// models/Brand.js
{
  name: String,               // brand's working name, e.g. "Fitness Brand" (user-given label)
  createdAt: { type: Date, default: Date.now },
  state: {
    brandName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    targetAudience: { type: String, default: "" },
    tone: { type: String, default: "" },
    keywords: { type: [String], default: [] }
  },
  messages: [{
    role: { type: String, enum: ["user", "assistant"] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
}
```

Embedding `messages` inside `Brand` is intentional: it makes cross-brand
isolation structurally guaranteed (a query for one brand can never touch
another brand's messages), and avoids a join/lookup for a project this size.

## Folder Structure

```
server/
  src/
    config/
      db.js
      groq.js
    models/
      Brand.js
    controllers/
      brandController.js
      chatController.js
    services/
      contextService.js     // builds the prompt sent to Groq
      llmService.js          // calls Groq, parses JSON response
    routes/
      brandRoutes.js
      chatRoutes.js
    app.js
    server.js
  .env.example
  package.json

client/
  src/
    components/
      BrandDropdown.jsx
      ChatWindow.jsx
      StatePanel.jsx
    api.js
    App.jsx
  package.json
```

## API Endpoints (implement exactly)

### POST /brands
Request: `{ "name": "Fitness Brand" }`
Creates a Brand doc with empty `state` and empty `messages`.
Response: the created brand object (include `_id`).

### GET /brands
Returns array of all brands: `{ _id, name, createdAt }` (no need to include
full state/messages in the list view).

### GET /brands/:id
Returns the full brand document: `state` + `messages` history. Used for
loading context when switching brands, and for the frontend's StatePanel.

### POST /chat
Request: `{ "brand_id": "123", "message": "Make it more premium" }`
Flow:
1. Find brand by `brand_id`. If not found, 404.
2. Build prompt via `contextService` using brand's current `state` + last
   3-4 raw messages (for tone/flow) + the new user message.
3. Call Groq via `llmService`, which MUST request structured JSON output
   (see Prompt Design below), and parse it.
4. Push the user message and the assistant's `reply` into `brand.messages`.
5. Merge the parsed `state` fields into `brand.state` (only overwrite fields
   the LLM actually returned/changed — see Design Decisions).
6. Save the brand.
7. Response: `{ "response": "<assistant reply text>" }`

## Prompt Design (critical — this is what gets graded)

System prompt template (fill in the current state as JSON):

```
You are a branding assistant helping a user develop a brand concept through
conversation. You must always respond with a single valid JSON object and
nothing else — no markdown, no commentary outside the JSON.

Current brand state:
{stateJson}

Recent conversation:
{last 3-4 messages, role: content}

The user's new message: "{newMessage}"

Update the brand concept based on this new message, building on the
existing state rather than starting over — unless the user clearly wants
to pivot. Return exactly this JSON shape:

{
  "reply": "<a short, natural conversational reply to the user, explaining or presenting the update>",
  "state": {
    "brandName": "<updated or unchanged brand name>",
    "tagline": "<updated or unchanged tagline>",
    "targetAudience": "<updated or unchanged target audience>",
    "tone": "<updated or unchanged tone, e.g. premium, playful, minimal>",
    "keywords": ["<updated or unchanged keyword list>"]
  }
}
```

`llmService` should:
- Call Groq's chat completions endpoint with this system prompt + the message.
- Set `response_format` to force JSON if the Groq model/SDK supports it;
  otherwise strip any accidental markdown fences before `JSON.parse`.
- On parse failure, retry once with a stricter "return ONLY JSON" reminder
  before failing gracefully (return a fallback reply, don't crash).

## Frontend Behavior

- `BrandDropdown`: lists brands (GET /brands), lets user select one or
  create a new one (POST /brands), and lifts the selected `brand_id` up.
- `ChatWindow`: shows `brand.messages` for the selected brand, has an input
  box, POSTs to /chat on send, appends the response, re-fetches brand state.
- `StatePanel`: shows the selected brand's current `state` (brandName,
  tagline, targetAudience, tone, keywords) — updates after every chat turn.
  This panel is what visually proves context evolves and stays isolated.
- Switching the dropdown selection must fully reload that brand's messages
  and state from GET /brands/:id — no state or messages should leak from
  the previously selected brand into the UI.

## Design Decisions to Document in README

- MongoDB chosen over a relational DB because the context is naturally a
  semi-structured document (per-brand state + message array), embedding
  avoids joins, and Atlas deploys faster than a managed Postgres instance
  for a time-boxed assignment.
- Structured state (not just raw chat replay) is used as the source of
  truth for "what has this brand become so far," because it makes context
  evolution and isolation directly observable (in the StatePanel and in the
  Loom demo) rather than something the reviewer has to infer from a chat
  transcript.
- Raw messages are still stored (not discarded) to preserve conversational
  tone/flow for the next prompt and to give a full audit trail.
- Isolation is structural: messages and state live embedded inside each
  Brand document, so a query for one brand's data can never touch another
  brand's data by construction.

## README Sections Required (mandatory, use assignment's exact headings)

1. Project Overview
2. Tech Stack
3. Architecture Overview (include a simple request-flow diagram, text is fine:
   `Client → Express Route → Controller → contextService (builds prompt) →
   llmService (calls Groq) → parse structured JSON → update Brand.state +
   Brand.messages → save → respond`)
4. Setup Instructions (clone, install, env vars: MONGO_URI, GROQ_API_KEY, PORT, run)
5. How to Use (curl examples for all 4 endpoints)
6. Design Decisions (use section above)
7. Limitations (e.g., no auth/user accounts, no summarization once history
   gets long, no streaming, single-tenant assumption, no rate limiting)
8. Future Improvements (context summarization for long chats, caching
   repeated requests, streaming responses via SSE, multi-user auth,
   better JSON-repair/retry logic for malformed LLM output)

## What NOT to Build (keep scope tight, per assignment's own guidance)

- No user authentication / accounts
- No streaming responses
- No caching layer (mention as future improvement only)
- No admin panel — the dropdown + chat + state panel IS the whole UI

## Deliverables Checklist

- [ ] Working backend with all 4 endpoints
- [ ] Working minimal frontend (dropdown, chat, state panel)
- [ ] README with all 8 sections above
- [ ] curl examples for every endpoint in README
- [ ] Loom video (5-10 min): approach, architecture, context management per
      brand, live demo showing two brands with isolated context, key
      trade-offs — link goes in README
- [ ] Push to a public GitHub repo
- [ ] Email the repo link to info@rohangirdhani.com
