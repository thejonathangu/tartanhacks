from django.urls import path
from archivist.views import lookup

urlpatterns = [
    path("lookup", lookup, name="archivist-lookup"),
]
