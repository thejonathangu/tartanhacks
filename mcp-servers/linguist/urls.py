from django.urls import path
from linguist.views import dialect

urlpatterns = [
    path("dialect", dialect, name="linguist-dialect"),
]
