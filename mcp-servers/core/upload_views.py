"""
Upload endpoint — accepts a PDF file and returns GeoJSON locations.
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.pdf_processor import process_pdf


@csrf_exempt
def upload_book(request):
    """
    POST /upload-book
    Content-Type: multipart/form-data
    Fields:
      - file: PDF file
      - title: (optional) book title string

    Returns GeoJSON FeatureCollection of extracted locations.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    pdf_file = request.FILES.get("file")
    if not pdf_file:
        return JsonResponse({"error": "No file uploaded. Send a 'file' field."}, status=400)

    # Validate it's a PDF
    if not pdf_file.name.lower().endswith(".pdf"):
        return JsonResponse({"error": "Only PDF files are supported."}, status=400)

    # Optional book title
    title = request.POST.get("title", "").strip()
    if not title:
        # Derive from filename
        title = pdf_file.name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    pdf_bytes = pdf_file.read()

    try:
        result = process_pdf(pdf_bytes, book_title=title)
    except Exception as exc:
        return JsonResponse({"error": f"Processing failed: {exc}"}, status=500)

    return JsonResponse(result)
