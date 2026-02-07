"""
Root URL configuration — wires up the Conductor and all three MCP agent apps.
"""

from django.urls import path, include
from core.views import index
from core.conductor import orchestrate

urlpatterns = [
    path("", index, name="index"),
    path("orchestrate", orchestrate, name="conductor-orchestrate"),
    path("tools/archivist/", include("archivist.urls")),
    path("tools/linguist/", include("linguist.urls")),
    path("tools/stylist/", include("stylist.urls")),
]
