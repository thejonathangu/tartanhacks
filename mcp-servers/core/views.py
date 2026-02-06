"""Root health / MCP discovery endpoint."""

from django.http import JsonResponse


def index(request):
    return JsonResponse({
        "project": "Living Literary Map",
        "protocol": "MCP",
        "agents": [
            {"name": "ArchivistAgent", "endpoint": "/tools/archivist/lookup"},
            {"name": "LinguistAgent", "endpoint": "/tools/linguist/dialect"},
            {"name": "StylistAgent", "endpoint": "/tools/stylist/style"},
        ],
    })
