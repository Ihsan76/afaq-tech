import os
import logging
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    from pypdf import PdfReader
    try:
        with default_storage.open(file_path, 'rb') as f:
            reader = PdfReader(f)
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as e:
        logger.error("PDF extraction failed for %s: %s", file_path, e)
        return ""


def extract_text_from_txt(file_path: str) -> str:
    try:
        with default_storage.open(file_path, 'r') as f:
            return f.read().strip()
    except Exception as e:
        logger.error("TXT extraction failed for %s: %s", file_path, e)
        return ""


def extract_text(document) -> str:
    if not document.file:
        return ""
    path = document.file.name
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    elif ext == ".txt":
        return extract_text_from_txt(path)
    else:
        logger.warning("Unsupported file type: %s", ext)
        return ""
