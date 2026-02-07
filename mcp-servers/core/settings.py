"""
Django settings for the Living Literary Map MCP servers.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "hackathon-insecure-dev-key-change-me")

DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "corsheaders",
    "archivist",
    "librarian",
    "linguist",
    "stylist",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

# Wide-open CORS for hackathon dev
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_HEADERS = ["accept", "content-type", "origin", "authorization", "x-requested-with"]

ROOT_URLCONF = "core.urls"

TEMPLATES = []
DATABASES = {}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Dedalus Labs ────────────────────────────────────────────────────────
DEDALUS_API_KEY = os.environ.get("DEDALUS_API_KEY", "")
DEDALUS_BASE_URL = "https://api.dedaluslabs.ai"
DEDALUS_MODEL = os.environ.get("DEDALUS_MODEL", "openai/gpt-4o")
