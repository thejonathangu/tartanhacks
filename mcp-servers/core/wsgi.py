"""
WSGI config for the Living Literary Map MCP servers.
Used by Gunicorn on Render for production serving.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

application = get_wsgi_application()
