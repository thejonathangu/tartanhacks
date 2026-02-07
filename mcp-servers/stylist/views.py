"""
StylistAgent — MCP Tool (Django view)

Generates Mapbox Style JSON overrides to change the map's visual "vibe"
based on the literary era selected.
"""

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from core.dedalus_client import dedalus_chat


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


STYLIST_SYSTEM_PROMPT = (
    "You are the StylistAgent, a visual design expert for literary maps.  "
    "Given an era and its colour palette, suggest one creative CSS/visual "
    "tweak (animation, gradient, or texture idea) in 1–2 sentences that "
    "would make the map feel more immersive for that period."
)


def _stylist_style(era: str) -> dict:
    """
    Internal function — callable by the Conductor for parallel orchestration.
    Returns a plain dict.
    """
    entry = STYLE_OVERRIDES.get(era)
    if entry is None:
        raise ValueError(f"Unknown era: {era}")

    user_msg = (
        f"Era: {era} — {entry['label']}\n"
        f"Palette: background {entry['background_color']}, accent {entry['accent_color']}\n"
        f"Font: {entry['font_suggestion']}\n\n"
        "Suggest one immersive visual tweak."
    )
    ai_suggestion = dedalus_chat(STYLIST_SYSTEM_PROMPT, user_msg)

    return {
        "era": era,
        **entry,
        "ai_suggestion": ai_suggestion,
    }


@csrf_exempt
@require_POST
def style(request):
    """
    POST /tools/stylist/style
    Body: { "era": "1940s" }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    era = body.get("era")
    if not era:
        return JsonResponse({"error": "era is required"}, status=400)

    try:
        result = _stylist_style(era)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=404)

    return JsonResponse(result)
