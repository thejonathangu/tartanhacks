"""
StylistAgent — MCP Tool Server

Generates Mapbox Style JSON overrides to change the map's visual "vibe"
based on the literary era selected.

Run:  uvicorn stylist.server:app --port 8002 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="StylistAgent MCP Server", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapbox style overrides per era
STYLE_OVERRIDES: dict[str, dict] = {
    "1920s": {
        "label": "Harlem Renaissance — Vibrant",
        "mapbox_style": "mapbox://styles/mapbox/streets-v12",
        "paint_overrides": {
            "circle-color": "#ff6b6b",
            "circle-radius": 12,
            "circle-stroke-color": "#ffd93d",
            "circle-stroke-width": 3,
        },
        "background_color": "#1a0a2e",
        "accent_color": "#ff6b6b",
        "font_suggestion": "Playfair Display",
    },
    "1940s": {
        "label": "Post-War Noir",
        "mapbox_style": "mapbox://styles/mapbox/dark-v11",
        "paint_overrides": {
            "circle-color": "#e6b800",
            "circle-radius": 10,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
        },
        "background_color": "#0d0d0d",
        "accent_color": "#e6b800",
        "font_suggestion": "Courier Prime",
    },
    "1960s": {
        "label": "Civil Rights — Bold",
        "mapbox_style": "mapbox://styles/mapbox/satellite-streets-v12",
        "paint_overrides": {
            "circle-color": "#4ecdc4",
            "circle-radius": 14,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
        },
        "background_color": "#0a1628",
        "accent_color": "#4ecdc4",
        "font_suggestion": "Oswald",
    },
}


class StyleRequest(BaseModel):
    era: str  # e.g. "1920s", "1940s", "1960s"


@app.post("/tools/stylist/style")
async def get_style(req: StyleRequest):
    entry = STYLE_OVERRIDES.get(req.era)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown era: {req.era}")
    return {"era": req.era, **entry}


@app.get("/")
async def root():
    return {
        "agent": "StylistAgent",
        "protocol": "MCP",
        "tools": [
            {
                "name": "stylist/style",
                "description": "Generate Mapbox style overrides for a literary era's visual vibe.",
                "inputSchema": StyleRequest.model_json_schema(),
            }
        ],
    }
