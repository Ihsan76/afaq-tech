import io
import logging
import os

from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def extract_text_from_pdf_fileobj(f, path: str) -> str:
    from pypdf import PdfReader
    try:
        reader = PdfReader(f)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as e:
        logger.error("PDF extraction failed for %s: %s", path, e)
        return ""


def extract_text_from_pdf(file_path: str) -> str:
    try:
        with default_storage.open(file_path, 'rb') as f:
            return extract_text_from_pdf_fileobj(f, file_path)
    except Exception as e:
        logger.error("PDF extraction failed for %s: %s", file_path, e)
        return ""


def extract_text_from_url(url: str) -> str:
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            content_type = resp.headers.get("Content-Type", "").lower()
            if "pdf" not in content_type:
                logger.warning("Skipping non-PDF external URL: %s (%s)", url, content_type)
                return ""
            data = resp.read()
        return extract_text_from_pdf_fileobj(io.BytesIO(data), url)
    except Exception as e:
        logger.error("External extraction failed for %s: %s", url, e)
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
        if document.external_url:
            return extract_text_from_url(document.external_url)
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
