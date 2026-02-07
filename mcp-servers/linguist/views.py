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

LINGUIST_DYNAMIC_PROMPT = (
    "You are the LinguistAgent, an expert in American English dialects. "
    "Given a decade/era, identify 3-5 notable slang terms or linguistic "
    "features from that period.  Return a JSON object with this structure:\n"
    '{"era_label": "Label for the era", "slang": [{"term": "word", "meaning": "definition"}], '
    '"dialect_notes": "Brief notes on the dialect"}\n'
    "Return ONLY valid JSON, no other text."
)


def _linguist_dialect(era: str) -> dict:
    """
    Internal function — callable by the Conductor for parallel orchestration.
    Returns a plain dict. For unknown eras, uses Dedalus to generate dialect info.
    """
    entry = ERA_DIALECTS.get(era)

    if entry is not None:
        # Known era — use curated data
        slang_list = ", ".join(f"'{s['term']}'" for s in entry["slang"])
        user_msg = (
            f"Era: {era} — {entry['era_label']}\n"
            f"Slang terms: {slang_list}\n"
            f"Notes: {entry['dialect_notes']}\n\n"
            "Write a 'Did You Know?' blurb."
        )
        ai_blurb = dedalus_chat(LINGUIST_SYSTEM_PROMPT, user_msg)

        return {
            "era": era,
            "era_label": entry["era_label"],
            "slang": entry["slang"],
            "dialect_notes": entry["dialect_notes"],
            "ai_blurb": ai_blurb,
        }

    # Unknown era — generate dynamically via Dedalus
    import json as _json
    import re as _re

    raw = dedalus_chat(LINGUIST_DYNAMIC_PROMPT, f"Era: {era}")
    try:
        json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match:
            data = _json.loads(json_match.group())
        else:
            data = _json.loads(raw)
    except _json.JSONDecodeError:
        data = {}

    era_label = data.get("era_label", f"{era} Era")
    slang = data.get("slang", [])
    dialect_notes = data.get("dialect_notes", f"Linguistic features of the {era}.")

    slang_list = ", ".join(f"'{s['term']}'" for s in slang[:5]) if slang else era
    blurb_msg = (
        f"Era: {era} — {era_label}\n"
        f"Slang terms: {slang_list}\n"
        f"Notes: {dialect_notes}\n\n"
        "Write a 'Did You Know?' blurb."
    )
    ai_blurb = dedalus_chat(LINGUIST_SYSTEM_PROMPT, blurb_msg)

    return {
        "era": era,
        "era_label": era_label,
        "slang": slang[:5],
        "dialect_notes": dialect_notes,
        "ai_blurb": ai_blurb,
    }


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

    try:
        result = _linguist_dialect(era)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=404)

    return JsonResponse(result)
