"""
Root URL configuration — wires up the Conductor and all three MCP agent apps.
"""

from django.urls import path, include
from core.views import index
from core.conductor import orchestrate
from core.searcher import vibe_search
from core.upload_views import upload_book

urlpatterns = [
    path("", index, name="index"),
    path("orchestrate", orchestrate, name="conductor-orchestrate"),
    path("search", vibe_search, name="vibe-search"),
    path("upload-book", upload_book, name="upload-book"),
    path("tools/archivist/", include("archivist.urls")),
    path("tools/linguist/", include("linguist.urls")),
    path("tools/stylist/", include("stylist.urls")),
]
