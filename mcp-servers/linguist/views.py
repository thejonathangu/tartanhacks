"""
LinguistAgent — MCP Agent (Django view)

Identifies period-specific slang and dialect based on the literary era,
then enriches the response with Dedalus-powered LLM commentary.
"""

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from core.dedalus_client import dedalus_chat


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


LINGUIST_SYSTEM_PROMPT = (
    "You are the LinguistAgent, an expert in American English dialects "
    "across different historical eras.  Given an era and its slang terms, "
    "write a fun 2-sentence 'Did You Know?' blurb about how one of these "
    "terms entered mainstream English.  Keep it lively and educational."
)


@csrf_exempt
@require_POST
def dialect(request):
    """
    POST /tools/linguist/dialect
    Body: { "era": "1920s" }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    era = body.get("era")
    if not era:
        return JsonResponse({"error": "era is required"}, status=400)

    entry = ERA_DIALECTS.get(era)
    if entry is None:
        return JsonResponse({"error": f"Unknown era: {era}"}, status=404)

    # ── Dedalus enrichment ──────────────────────────────────────────
    slang_list = ", ".join(f"'{s['term']}'" for s in entry["slang"])
    user_msg = (
        f"Era: {era} — {entry['era_label']}\n"
        f"Slang terms: {slang_list}\n"
        f"Notes: {entry['dialect_notes']}\n\n"
        "Write a 'Did You Know?' blurb."
    )
    ai_blurb = dedalus_chat(LINGUIST_SYSTEM_PROMPT, user_msg)

    return JsonResponse({
        "era": era,
        "era_label": entry["era_label"],
        "slang": entry["slang"],
        "dialect_notes": entry["dialect_notes"],
        "ai_blurb": ai_blurb,
    })
