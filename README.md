# 🗺️ Living Literary Map

**An MCP-orchestrated interactive map exploring American migration narratives, the Harlem Renaissance, and Civil Rights landmarks through literature.**

> Built for TartanHacks 2026 · Powered by [Dedalus Labs](https://dedaluslabs.ai) MCP Hosting

---

## 🏗️ Architecture — Modular MCP Orchestration

This project demonstrates **agentic task delegation** using the Model Context Protocol. Instead of one monolithic prompt, a **ConductorAgent** orchestrates three specialist MCP servers in parallel:

```plaintext
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Mapbox GL JS)                            │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Map View │  │ Era Filters  │  │ Delegation Timeline   │  │
│  └────┬─────┘  └──────┬───────┘  └───────────────────────┘  │
│       │               │                                     │
│       └───────┬───────┘                                     │
│               ▼                                             │
│     POST /orchestrate                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│  ConductorAgent (Django)                                  │
│  "The Brain" — receives user action, reasons about which  │
│  specialists to invoke, fans out PARALLEL requests        │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 🏛 Archivist │  │ 🗣 Linguist  │  │ 🎨 Stylist   │    │
│  │ Agent        │  │ Agent        │  │ Agent        │    │
│  │              │  │              │  │              │    │
│  │ get_         │  │ analyze_     │  │ generate_    │    │
│  │ historical_  │  │ period_      │  │ map_style    │    │
│  │ context      │  │ dialect      │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │            │
│         └────────┬────────┘──────────────────┘            │
│                  ▼                                        │
│         Dedalus Labs API (openai/gpt-4o)                  │
│         Each agent enriches its response with AI          │
│                  │                                        │
│                  ▼                                        │
│         🎼 Conductor Synthesis                            │
│         Merges all results + generates unified narrative  │
└───────────────────────────────────────────────────────────┘
```

### The Three Specialist MCP Servers

| Agent                 | Tool                     | Role              | What It Does                                                                                                                    |
| --------------------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 🏛 **ArchivistAgent** | `get_historical_context` | Data & Facts      | Retrieves verified quotes, historical context, and dialect notes from a curated knowledge base, then enriches with AI deep-dive |
| 🗣 **LinguistAgent**  | `analyze_period_dialect` | Cultural Analysis | Identifies era-specific slang and linguistic patterns (e.g., 1920s Harlem jive, 1940s Cantonese-English code-switching)         |
| 🎨 **StylistAgent**   | `generate_map_style`     | Visual Design     | Generates Mapbox Style JSON overrides and color palettes to change the map's visual "vibe" per era                              |

### The Delegation Workflow

1. **User Action**: User clicks a landmark or selects an era
2. **Single Request**: Frontend sends ONE request to `POST /orchestrate`
3. **Conductor Reasoning**: Determines which specialists are needed
4. **Parallel Fan-out**: All relevant agents execute simultaneously via `ThreadPoolExecutor`
5. **AI Enrichment**: Each agent calls Dedalus Labs (GPT-4o) to enrich its response
6. **Synthesis**: Conductor generates a unified narrative tying all outputs together
7. **Timeline**: Returns a delegation timeline showing each agent's status and latency
8. **UI Update**: Frontend renders results with real-time orchestration visualization

## 📍 Featured Landmarks

### 🚢 1940s — Post-War Immigration (The Joy Luck Club)

- San Francisco Immigration Landing
- Chinatown — Grant Avenue

### 🎷 1920s — Harlem Renaissance

- The Cotton Club
- The Apollo Theater
- Cathedral of St. John the Divine

### ✊ 1960s — Civil Rights Movement

- Montgomery Bus Boycott
- Birmingham — 16th Street Baptist Church
- Lincoln Memorial — "I Have a Dream"

## 🚀 Quick Start

```bash
# 1. Start the MCP backend (Django + 3 agents + Conductor)
cd mcp-servers
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000

# 2. Build & serve the frontend
cd frontend
npm install
npx vite build
cd dist && python3 -m http.server 3000 --bind 0.0.0.0

# 3. Open http://localhost:3000 in your browser
```

### Environment Variables

**`mcp-servers/.env`**

```env
DEDALUS_API_KEY=dsk-live-...
```

**`frontend/.env`**

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
VITE_MCP_BASE_URL=http://localhost:8000
```

## 🛠 Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Frontend      | React 18 + Vite 5 + Mapbox GL JS 3.3            |
| Map Tiles     | Mapbox (Satellite, Dark, Streets, Light)        |
| Street View   | Google Static Street View API                   |
| Backend       | Django 5.1 (Python)                             |
| AI Provider   | Dedalus Labs (OpenAI-compatible, GPT-4o)        |
| Protocol      | Model Context Protocol (MCP)                    |
| Orchestration | ConductorAgent with parallel ThreadPoolExecutor |

## 🏆 Why This Wins

1. **Not just "one prompt"** — demonstrates Modular Orchestration where each task is handled by the specialist best suited for it
2. **Visible delegation timeline** — judges can see exactly which agents were called, what tools they used, and how long each took
3. **Parallel execution** — agents run simultaneously, not sequentially
4. **Conductor synthesis** — a meta-agent ties all specialist outputs into a coherent narrative
5. **Dynamic visual theming** — StylistAgent actually changes the map's appearance in real-time
6. **Rich cultural data** — real historical context, era-specific slang, and literary quotes

## Team

Built for TartanHacks 2026.
