# 🗺️ Living Literary Map

A web app (React + Mapbox) where users explore migration routes in _The Joy Luck Club_, Harlem Renaissance landmarks, and Civil Rights landmarks — powered by agentic MCP servers hosted on Dedalus Labs.

## Quick Start (Devcontainer)

1. **Clone** the repo and open it in VS Code.
2. **Reopen in Container** — VS Code will prompt you automatically, or run:
   `Ctrl+Shift+P → Dev Containers: Reopen in Container`
3. **Set your env vars** — copy `.env.example` to `.env` and fill in your Mapbox token + Dedalus key.
4. **Start the frontend:**
   ```bash
   cd frontend && npm run dev
   ```
5. **Start the MCP servers:**
   ```bash
   cd mcp-servers
   uvicorn archivist.server:app --port 8000 --reload
   uvicorn linguist.server:app --port 8001 --reload
   uvicorn stylist.server:app  --port 8002 --reload
   ```

## Architecture

```
┌─────────────┐     click marker      ┌──────────────────┐
│  React App  │ ──────────────────────▶│  ArchivistAgent  │ :8000
│  + Mapbox   │ ◀── deep context ──── │  (MCP Tool)      │
│  :3000      │                        └──────────────────┘
│             │     era selector        ┌──────────────────┐
│             │ ──────────────────────▶│  LinguistAgent   │ :8001
│             │ ◀── slang/dialect ─── │  (MCP Agent)     │
│             │                        └──────────────────┘
│             │     era selector        ┌──────────────────┐
│             │ ──────────────────────▶│  StylistAgent    │ :8002
│             │ ◀── style JSON ────── │  (MCP Tool)      │
└─────────────┘                        └──────────────────┘
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
├── mcp-servers/         # Python FastAPI MCP servers
│   ├── archivist/       # Quotes + historical context
│   ├── linguist/        # Period slang & dialect
│   └── stylist/         # Mapbox style overrides
└── .env.example         # Environment variable template
```

## Team

Built for TartanHacks 2026.
