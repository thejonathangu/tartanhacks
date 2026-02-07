"""
SemanticSearchAgent — "Vibe Search" for the Living Literary Map.

Allows users to search with abstract feelings rather than addresses:
  "Show me somewhere that feels like a lonely rainy Sunday"

The agent uses Dedalus (GPT-4o) to match the user's vibe query against
the knowledge base and returns ranked landmark matches.
"""

import json
import time

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from archivist.knowledge_base import KNOWLEDGE_BASE
from core.dedalus_client import dedalus_chat


SEARCH_SYSTEM_PROMPT = (
    "You are a semantic search engine for a literary map. Given a user's "
    "vibe/feeling query and a list of literary landmarks with their quotes "
    "and historical context, return a JSON array of the top 3 matching "
    "landmark IDs ranked by relevance, with a brief 'reason' for each match.\n\n"
    "IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.\n"
    "Format: [{\"id\": \"landmark-id\", \"reason\": \"why it matches\", \"vibe_score\": 0.95}]\n"
    "vibe_score should be 0.0 to 1.0 indicating match strength."
)


def _build_landmark_summary() -> str:
    """Build a compact summary of all landmarks for the LLM."""
    lines = []
    for lid, entry in KNOWLEDGE_BASE.items():
        moods = ", ".join(entry.get("mood", []))
        lines.append(
            f"- {lid}: \"{entry['quote'][:80]}...\" | "
            f"{entry['book']} ({entry['era']}) | "
            f"Mood: {moods} | "
            f"{entry['historical_context'][:100]}..."
        )
    return "\n".join(lines)


@csrf_exempt
@require_POST
def vibe_search(request):
    """
    POST /search
    Body: { "query": "somewhere that feels like a lonely rainy Sunday" }

    Returns ranked landmarks matching the user's vibe.
    """
    t_start = time.perf_counter()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    query = body.get("query", "").strip()
    if not query:
        return JsonResponse({"error": "query is required"}, status=400)

    landmark_summary = _build_landmark_summary()
    user_msg = (
        f"User's vibe query: \"{query}\"\n\n"
        f"Available landmarks:\n{landmark_summary}\n\n"
        "Return the top 3 matching landmarks as a JSON array."
    )

    t0 = time.perf_counter()
    raw_response = dedalus_chat(SEARCH_SYSTEM_PROMPT, user_msg, max_tokens=600)
    ai_ms = round((time.perf_counter() - t0) * 1000)

    # Parse the AI response
    matches = []
    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            for item in parsed:
                lid = item.get("id", "")
                if lid in KNOWLEDGE_BASE:
                    entry = KNOWLEDGE_BASE[lid]
                    matches.append({
                        "landmark_id": lid,
                        "title": entry.get("quote", "")[:60],
                        "book": entry["book"],
                        "era": entry["era"],
                        "reason": item.get("reason", ""),
                        "vibe_score": item.get("vibe_score", 0.5),
                    })
    except (json.JSONDecodeError, KeyError):
        # Fallback: return all landmarks
        pass

    total_ms = round((time.perf_counter() - t_start) * 1000)

    return JsonResponse({
        "query": query,
        "matches": matches,
        "ai_ms": ai_ms,
        "total_ms": total_ms,
    })
