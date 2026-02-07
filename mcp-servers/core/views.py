"""Root health / MCP discovery endpoint."""

from django.http import JsonResponse


def index(request):
    return JsonResponse({
        "project": "Living Literary Map",
        "protocol": "MCP (Model Context Protocol)",
        "architecture": "Conductor → 3 Specialist MCP Agents",
        "orchestrator": {
            "name": "ConductorAgent",
            "endpoint": "/orchestrate",
            "description": "Single entry-point that fans out parallel requests to all specialists",
        },
        "agents": [
            {
                "name": "LibrarianAgent",
                "endpoint": "/tools/librarian/search",
                "tool": "search_books",
                "description": "Searches Open Library for books by title and returns closest matches",
            },
            {
                "name": "ArchivistAgent",
                "endpoint": "/tools/archivist/lookup",
                "tool": "get_historical_context",
                "description": "Retrieves book-specific quotes and historical context",
            },
            {
                "name": "LinguistAgent",
                "endpoint": "/tools/linguist/dialect",
                "tool": "analyze_period_dialect",
                "description": "Identifies era-specific slang and dialect patterns",
            },
            {
                "name": "StylistAgent",
                "endpoint": "/tools/stylist/style",
                "tool": "generate_map_style",
                "description": "Generates Mapbox Style overrides for visual era theming",
            },
        ],
        "powered_by": "Dedalus Labs (openai/gpt-4o)",
    })
