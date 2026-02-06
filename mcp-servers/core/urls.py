"""
Root URL configuration — wires up all three MCP agent apps.
"""

from django.urls import path, include
from core.views import index

urlpatterns = [
    path("", index, name="index"),
    path("tools/archivist/", include("archivist.urls")),
    path("tools/linguist/", include("linguist.urls")),
    path("tools/stylist/", include("stylist.urls")),
]
