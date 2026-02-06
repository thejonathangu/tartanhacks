"""
LinguistAgent — MCP Tool Server

Identifies period-specific slang and dialect based on the literary era.

Run:  uvicorn linguist.server:app --port 8001 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LinguistAgent MCP Server", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ERA_DIALECTS: dict[str, dict] = {
    "1920s": {
        "era_label": "Harlem Renaissance / Jazz Age",
        "slang": [
            {"term": "copacetic", "meaning": "Excellent, fine"},
            {"term": "the bee's knees", "meaning": "An outstanding person or thing"},
            {"term": "jive", "meaning": "Misleading or deceptive talk"},
            {"term": "ofay", "meaning": "Slang for a white person (derogatory)"},
            {"term": "hep", "meaning": "Aware, in the know (precursor to 'hip')"},
        ],
        "dialect_notes": (
            "Harlem English in the 1920s blended Southern Black English with "
            "Northern urban vernacular. Jazz musicians contributed heavily to "
            "slang that later entered mainstream American English."
        ),
    },
    "1940s": {
        "era_label": "Post-WWII / Chinese-American Immigration",
        "slang": [
            {"term": "swell", "meaning": "Wonderful, great"},
            {"term": "broad", "meaning": "A woman (informal)"},
            {"term": "gung-ho", "meaning": "Enthusiastic (borrowed from Chinese)"},
            {"term": "lose face", "meaning": "To be humiliated (Chinese-English calque)"},
        ],
        "dialect_notes": (
            "Cantonese-English code-switching was common in Chinatown "
            "communities. Phrases like 'eat bitter' (吃苦, chī kǔ) and "
            "'lose face' entered everyday speech."
        ),
    },
    "1960s": {
        "era_label": "Civil Rights Movement",
        "slang": [
            {"term": "freedom rider", "meaning": "Civil rights activist who rode interstate buses"},
            {"term": "sit-in", "meaning": "Nonviolent protest by sitting in segregated spaces"},
            {"term": "soul brother / soul sister", "meaning": "Fellow Black person"},
            {"term": "The Man", "meaning": "The establishment, authority figures"},
            {"term": "right on", "meaning": "Expression of agreement or encouragement"},
        ],
        "dialect_notes": (
            "Southern Black vernacular: 'fixing to' (about to), 'carry' "
            "(to drive someone), 'might could' (might be able to)."
        ),
    },
}


class DialectRequest(BaseModel):
    era: str  # e.g. "1920s", "1940s", "1960s"


@app.post("/tools/linguist/dialect")
async def get_dialect(req: DialectRequest):
    entry = ERA_DIALECTS.get(req.era)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown era: {req.era}")
    return {"era": req.era, **entry}


@app.get("/")
async def root():
    return {
        "agent": "LinguistAgent",
        "protocol": "MCP",
        "tools": [
            {
                "name": "linguist/dialect",
                "description": "Get period-specific slang and dialect for a literary era.",
                "inputSchema": DialectRequest.model_json_schema(),
            }
        ],
    }
