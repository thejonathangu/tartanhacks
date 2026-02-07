from django.urls import path
from librarian.views import search

urlpatterns = [
    path("search", search, name="librarian-search"),
]
