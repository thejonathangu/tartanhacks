"""
Root URL configuration — wires up the Conductor and all MCP agent apps + PDF upload.
"""

from django.urls import path, include
from core.views import index
from core.conductor import orchestrate
from core.searcher import vibe_search
from core.upload_views import upload_book
from core.title_extractor import extract_from_title

urlpatterns = [
    path("", index, name="index"),
    path("orchestrate", orchestrate, name="conductor-orchestrate"),
    path("search", vibe_search, name="vibe-search"),
    path("upload-book", upload_book, name="upload-book"),
    path("extract-from-title", extract_from_title, name="extract-from-title"),
    path("tools/archivist/", include("archivist.urls")),
    path("tools/librarian/", include("librarian.urls")),
    path("tools/linguist/", include("linguist.urls")),
    path("tools/stylist/", include("stylist.urls")),
]
