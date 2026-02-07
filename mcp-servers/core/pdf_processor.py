"""
PDF Processor — extracts text from uploaded PDFs, then uses Dedalus AI
to identify real-world locations mentioned in the book and return them
as GeoJSON-compatible features for the map.
"""

import json
import re
import fitz  # PyMuPDF
from core.dedalus_client import dedalus_chat


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int = 200) -> str:
    """Extract plain text from PDF bytes, capped at max_pages."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = min(len(doc), max_pages)    # determines number of pages to extract
    chunks = []
    for i in range(pages):
        text = doc[i].get_text()
        if text.strip():
            chunks.append(text)
    doc.close()
    return "\n".join(chunks)


def _truncate(text: str, max_chars: int = 100000) -> str:
    """Truncate text to fit within token limits for the AI call."""
    if len(text) <= max_chars:
        return text
    # Take beginning and end for better coverage
    half = max_chars // 2
    return text[:half] + "\n\n[...middle of text truncated...]\n\n" + text[-half:]


LOCATION_EXTRACTION_PROMPT = """You are an expert literary geographer. Given an excerpt from a book, identify real-world geographic locations that are mentioned or clearly referenced in the text.

For each location, provide:
1. A specific place name and descriptive title
2. The latitude and longitude (be precise — use real coordinates)
3. A relevant quote from the text mentioning or describing this place
4. Brief historical context connecting the book to this location
5. The mood/atmosphere of this location as described in the text
6. An estimated year/era the book references
7. A relevance score (1-10) indicating narrative importance:
   - 10 = Central to the plot, major scene, protagonist's home/journey destination
   - 7-9 = Significant location, important events occur here
   - 4-6 = Supporting location, mentioned multiple times or has narrative weight
   - 1-3 = Minor mention, background detail, passing reference

Return your response as a JSON array with this exact structure:
[
  {
    "id": "unique-slug-id",
    "title": "Place Name — Short Description",
    "book": "Book Title",
    "era": "decade like 1920s, 1940s, 1960s, 1980s, 2000s etc",
    "year": 1925,
    "coordinates": [longitude, latitude],
    "quote": "Relevant quote from the text...",
    "historical_context": "Why this place matters in the book's context...",
    "mood": "comma,separated,mood,words",
    "relevance": 9
  }
]

Rules:
- Only include REAL places with accurate coordinates
- Extract 3-10 locations maximum
- Prefer the most significant/memorable locations (relevance 6+)
- Assign relevance scores based on narrative importance, not just frequency of mention
- The most important location should get 10, least important should get lower scores
- If a location is vague (e.g. just "the city"), try to infer the specific place from context
- Return ONLY the JSON array, no other text"""


def _extract_complete_objects(text: str) -> list[dict]:
    """
    Extract complete JSON objects from a potentially truncated JSON array.
    """
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


def extract_locations_from_text(text: str, book_title: str = "Unknown") -> list[dict]:
    """Use Dedalus AI to extract geographic locations from book text."""
    truncated = _truncate(text)

    user_msg = f"Book title: {book_title}\n\nText excerpt:\n{truncated}"

    raw_response = dedalus_chat(
        system_prompt=LOCATION_EXTRACTION_PROMPT,
        user_message=user_msg,
        max_tokens=4096,
    )

    # Parse the JSON from the response
    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```\w*\s*', '', cleaned)
            cleaned = re.sub(r'\s*```\s*$', '', cleaned)

        # First, try to parse the full cleaned text directly
        try:
            locations = json.loads(cleaned)
        except json.JSONDecodeError:
            # If the response was truncated, extract complete JSON objects
            locations = _extract_complete_objects(cleaned)
    except Exception:
        return []

    return locations


def locations_to_geojson(locations: list[dict]) -> dict:
    """Convert extracted locations to a GeoJSON FeatureCollection.
    
    Sorts locations by relevance (highest first) and assigns rank 1-N.
    """
    # Sort by relevance score (highest to lowest)
    sorted_locations = sorted(
        locations, 
        key=lambda x: x.get("relevance", 5), 
        reverse=True
    )
    
    features = []
    for rank, loc in enumerate(sorted_locations, start=1):
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": loc.get("coordinates", [0, 0]),
            },
            "properties": {
                "id": loc.get("id", "unknown"),
                "title": loc.get("title", "Unknown Location"),
                "book": loc.get("book", "Unknown"),
                "era": loc.get("era", "2000s"),
                "year": loc.get("year", 2000),
                "quote": loc.get("quote", ""),
                "historical_context": loc.get("historical_context", ""),
                "mood": loc.get("mood", ""),
                "relevance": loc.get("relevance", 5),  # Keep original score
                "rank": rank,  # Assigned rank based on sorted order (1 = most important)
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def process_pdf(pdf_bytes: bytes, book_title: str = "Unknown") -> dict:
    """
    Full pipeline: PDF bytes → text extraction → AI location extraction → GeoJSON.
    Returns a dict with the GeoJSON and metadata.
    """
    text = extract_text_from_pdf(pdf_bytes)

    if not text.strip():
        return {
            "error": "Could not extract any text from the PDF",
            "geojson": {"type": "FeatureCollection", "features": []},
        }

    locations = extract_locations_from_text(text, book_title)
    geojson = locations_to_geojson(locations)

    return {
        "book_title": book_title,
        "pages_extracted": len(text.split('\n')),
        "locations_found": len(locations),
        "geojson": geojson,
    }
