"""
ArchivistAgent — MCP Tool (Django view)

Given a landmark_id, returns the literary quote, historical context, and
an LLM-enriched "deep dive" generated via the Dedalus API.

This is the endpoint the frontend calls after a marker click
(the "handoff" from UI → agent).
"""

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from archivist.knowledge_base import KNOWLEDGE_BASE
from core.dedalus_client import dedalus_chat


ARCHIVIST_SYSTEM_PROMPT = (
    "You are the ArchivistAgent, a literary historian specializing in "
    "American migration narratives.  Given a quote, book title, and era, "
    "provide a 2–3 sentence enriched historical insight that a student or "
    "museum visitor would find fascinating.  Be concise and vivid."
)


def _archivist_lookup(landmark_id: str) -> dict:
    """
    Internal function — callable by the Conductor for parallel orchestration.
    Returns a plain dict (not an HttpResponse).
    """
    entry = KNOWLEDGE_BASE.get(landmark_id)
    if entry is None:
        raise ValueError(f"Unknown landmark: {landmark_id}")

    user_msg = (
        f"Book: {entry['book']} ({entry['era']})\n"
        f"Quote: \"{entry['quote']}\"\n"
        f"Base context: {entry['historical_context']}\n\n"
        "Give me an enriched 2–3 sentence deep-dive insight."
    )
    ai_insight = dedalus_chat(ARCHIVIST_SYSTEM_PROMPT, user_msg)

    return {
        "landmark_id": landmark_id,
        "quote": entry["quote"],
        "historical_context": entry["historical_context"],
        "dialect_note": entry.get("dialect_note"),
        "year": entry["year"],
        "book": entry["book"],
        "ai_insight": ai_insight,
    }


@csrf_exempt
@require_POST
def lookup(request):
    """
    POST /tools/archivist/lookup
    Body: { "landmark_id": "jlc-san-francisco" }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    landmark_id = body.get("landmark_id")
    if not landmark_id:
        return JsonResponse({"error": "landmark_id is required"}, status=400)

    try:
        result = _archivist_lookup(landmark_id)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=404)

    return JsonResponse(result)
