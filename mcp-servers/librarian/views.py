"""
LibrarianAgent — MCP Tool (Django view)

Searches the Open Library API for books matching a user query
and returns the closest matches with cover images, authors,
and publication info.

This is the "book discovery" agent — the first step before
handing off to the Archivist for deep literary analysis.
"""

import json

import httpx
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVER_URL = "https://covers.openlibrary.org/b/olid"


def _librarian_search(query: str, limit: int = 10) -> dict:
    """
    Internal function — callable by the Conductor for orchestration.
    Searches Open Library and returns a normalised list of results.
    """
    if not query or not query.strip():
        raise ValueError("Search query must not be empty")

    resp = httpx.get(
        OPEN_LIBRARY_SEARCH_URL,
        params={
            "title": query.strip(),
            "limit": limit,
            "fields": (
                "key,title,author_name,first_publish_year,"
                "cover_edition_key,edition_count,isbn,subject,"
                "language,publisher"
            ),
        },
        timeout=10.0,
    )
    resp.raise_for_status()
    data = resp.json()

    books = []
    for doc in data.get("docs", []):
        cover_key = doc.get("cover_edition_key")
        books.append({
            "key": doc.get("key"),                         # e.g. "/works/OL45804W"
            "title": doc.get("title"),
            "authors": doc.get("author_name", []),
            "first_publish_year": doc.get("first_publish_year"),
            "edition_count": doc.get("edition_count", 0),
            "cover_url": (
                f"{OPEN_LIBRARY_COVER_URL}/{cover_key}-M.jpg"
                if cover_key else None
            ),
            "isbn": (doc.get("isbn") or [None])[0],
            "subjects": (doc.get("subject") or [])[:5],
            "languages": doc.get("language", []),
            "publishers": (doc.get("publisher") or [])[:3],
        })

    return {
        "query": query.strip(),
        "num_found": data.get("numFound", 0),
        "books": books,
    }


@csrf_exempt
@require_POST
def search(request):
    """
    POST /tools/librarian/search
    Body: { "query": "the joy luck club", "limit": 10 }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    query = body.get("query")
    if not query:
        return JsonResponse({"error": "query is required"}, status=400)

    limit = body.get("limit", 10)
    
    # Validate limit parameter type and bounds
    if not isinstance(limit, int):
        return JsonResponse(
            {"error": "limit must be an integer"},
            status=400
        )
    if limit < 1:
        return JsonResponse(
            {"error": "limit must be at least 1"},
            status=400
        )
    if limit > 100:
        return JsonResponse(
            {"error": "limit must not exceed 100"},
            status=400
        )

    try:
        result = _librarian_search(query, limit=limit)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except httpx.HTTPStatusError as e:
        return JsonResponse(
            {"error": f"Open Library API error: {e.response.status_code}"},
            status=502,
        )
    except httpx.RequestError as e:
        return JsonResponse(
            {"error": f"Open Library request failed: {str(e)}"},
            status=502,
        )

    return JsonResponse(result)
