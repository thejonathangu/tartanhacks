from django.urls import path
from stylist.views import style

urlpatterns = [
    path("style", style, name="stylist-style"),
]
