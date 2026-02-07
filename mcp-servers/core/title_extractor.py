"""
Title Extractor — uses Dedalus AI to extract notable geographic locations
from a book based solely on its title and metadata (no PDF needed).

This is the "lightweight" counterpart to pdf_processor.py: instead of
parsing a full PDF, we ask the LLM to recall well-known locations
associated with a given book.
"""

import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.dedalus_client import dedalus_chat
from core.pdf_processor import locations_to_geojson


TITLE_EXTRACTION_PROMPT = """You are an expert literary geographer with encyclopedic knowledge of world literature. Given a book title and optional metadata (author, publication year), identify the most significant real-world geographic locations featured in or associated with that book.

For each location, provide:
1. A specific place name and descriptive title
2. The latitude and longitude (be precise — use real coordinates)
3. A relevant quote or reference from the book mentioning or describing this place
4. Brief historical context connecting the book to this location
5. The mood/atmosphere of this location as described in the book
6. The year/era — use the time period when the story's ACTION takes place at that location:
   - Use the year the CHARACTERS actually visit or experience that place in the narrative
   - "The Da Vinci Code" is set in ~2003 — characters visit the Louvre, Rosslyn Chapel etc. in present day, so use ~2003 even though the plot involves Da Vinci
   - "All the Light We Cannot See" — use ~1944 because the characters experience WWII-era Saint-Malo
   - "The Pillars of the Earth" — use ~1170 because the story takes place in medieval England
   - The key question is: WHEN does the protagonist walk through this place?
   - If a book has dual timelines (e.g., historical flashbacks + present day), use the timeline that has the most narrative weight at that location
   - Different locations CAN have different years if the story's timeline shifts

Return your response as a JSON array with this exact structure:
[
  {
    "id": "unique-slug-id",
    "title": "Place Name — Short Description",
    "book": "Book Title",
    "era": "decade like 1170s, 1920s, 1940s, 2000s etc",
    "year": 1925,
    "coordinates": [longitude, latitude],
    "quote": "A memorable quote or reference from the book about this place...",
    "historical_context": "Why this place matters in the book's context...",
    "mood": "comma,separated,mood,words"
  }
]

Rules:
- Only include REAL places with accurate coordinates
- Extract 3-10 locations maximum
- Prefer the most iconic/memorable locations from the book
- Use your knowledge of the book's content to provide accurate quotes or close paraphrases
- The "year" field should reflect WHEN the story's characters experience that location, not the publication date and not some historical figure merely referenced in the plot
- If you don't recognize the book, still try to identify locations if possible from the title
- Return ONLY the JSON array, no other text"""


def _extract_complete_objects(text: str) -> list[dict]:
    """
    Extract complete JSON objects from a potentially truncated JSON array.
    Handles the common case where the AI response is cut off mid-object.
    """
    # Find all complete JSON objects {...}
    objects = []
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                try:
                    obj = json.loads(text[start:i + 1])
                    objects.append(obj)
                except json.JSONDecodeError:
                    pass
                start = None
    return objects


def extract_locations_from_title(title: str, author: str = "", year: str = "") -> list[dict]:
    """Use Dedalus AI to identify geographic locations from a book title."""
    parts = [f"Book title: {title}"]
    if author:
        parts.append(f"Author: {author}")
    if year:
        parts.append(f"First published: {year}")

    user_msg = "\n".join(parts)

    raw_response = dedalus_chat(
        system_prompt=TITLE_EXTRACTION_PROMPT,
        user_message=user_msg,
        max_tokens=4096,
    )

    # Parse the JSON from the response
    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            # Remove opening fence (```json or ```)
            cleaned = re.sub(r'^```\w*\s*', '', cleaned)
            # Remove closing fence
            cleaned = re.sub(r'\s*```\s*$', '', cleaned)

        # First, try to parse the full cleaned text directly
        try:
            locations = json.loads(cleaned)
        except json.JSONDecodeError:
            # If the response was truncated (common with AI), try to repair it
            # by finding complete JSON objects within a partial array
            locations = _extract_complete_objects(cleaned)
    except Exception:
        return []

    # Ensure the book field is set correctly
    for loc in locations:
        if not loc.get("book"):
            loc["book"] = title

    return locations


@csrf_exempt
def extract_from_title(request):
    """
    POST /extract-from-title
    Content-Type: application/json
    Body: { "title": "...", "author": "...", "year": "..." }

    Returns GeoJSON FeatureCollection of locations associated with the book.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    title = body.get("title", "").strip()
    if not title:
        return JsonResponse({"error": "A 'title' field is required."}, status=400)

    author = body.get("author", "").strip()
    year = str(body.get("year", "")).strip()

    try:
        locations = extract_locations_from_title(title, author, year)
        geojson = locations_to_geojson(locations)
    except Exception as exc:
        return JsonResponse({"error": f"Extraction failed: {exc}"}, status=500)

    return JsonResponse({
        "book_title": title,
        "author": author or None,
        "locations_found": len(locations),
        "geojson": geojson,
    })
