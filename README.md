# 🗺️ Living Literary Map

A web app (React + Mapbox) where users explore migration routes in _The Joy Luck Club_, Harlem Renaissance landmarks, and Civil Rights landmarks — powered by agentic MCP servers on Django + Dedalus Labs.

## Quick Start (Devcontainer)

1. **Clone** the repo and open it in VS Code.
2. **Reopen in Container** — VS Code will prompt you automatically, or run:
   `Ctrl+Shift+P → Dev Containers: Reopen in Container`
3. **Set your env vars** — copy `.env.example` to `.env` and fill in your Mapbox token + Dedalus key.
4. **Start the frontend:**
   ```bash
   cd frontend && npm run dev
   ```
5. **Start the Django MCP server (all 3 agents on one server):**
   ```bash
   cd mcp-servers && python manage.py runserver 0.0.0.0:8000
   ```

## Architecture

```
┌─────────────┐     click marker      ┌──────────────────────────────────┐
│  React App  │ ──────────────────────▶│  Django MCP Server (:8000)       │
│  + Mapbox   │ ◀── deep context ──── │                                  │
│  :3000      │                        │  /tools/archivist/lookup         │
│             │                        │  /tools/linguist/dialect         │
│             │                        │  /tools/stylist/style            │
│             │                        │                                  │
│             │                        │  ┌────────────────────────────┐  │
│             │                        │  │  Dedalus Labs API          │  │
│             │                        │  │  (LLM enrichment via       │  │
│             │                        │  │   openai/gpt-4o)           │  │
│             │                        │  └────────────────────────────┘  │
└─────────────┘                        └──────────────────────────────────┘
```

## Project Structure

```
tartanhacks/
├── .devcontainer/       # Devcontainer config (Docker + VS Code)
├── frontend/            # React + Vite + Mapbox GL JS
│   └── src/
│       ├── components/  # MapComponent (reusable)
│       ├── data/        # GeoJSON literary points
│       └── api/         # MCP client wrappers
├── mcp-servers/         # Django project — all 3 MCP agents
│   ├── core/            # Settings, URLs, Dedalus client
│   ├── archivist/       # Quotes + historical context
│   ├── linguist/        # Period slang & dialect
│   └── stylist/         # Mapbox style overrides
└── .env.example         # Environment variable template
```

## Dedalus Labs Integration

All three agents call the Dedalus API (`https://api.dedaluslabs.ai/v1/chat/completions`)
to enrich static data with LLM-generated insights.  The shared client lives in
`mcp-servers/core/dedalus_client.py`.  Set `DEDALUS_API_KEY` in your `.env`.

## Team

Built for TartanHacks 2026.
