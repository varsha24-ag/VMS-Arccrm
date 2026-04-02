import re
from typing import Optional
from urllib.parse import urlparse

from fastapi import Request
from app.core.config import settings

def get_dynamic_frontend_url(request: Request) -> Optional[str]:
    """Retrieve and validate the frontend origin from a request to avoid hardcoded URLs."""
    origin = request.headers.get("origin")
    if origin and re.match(settings.CORS_ORIGIN_REGEX, origin):
        return origin
        
    referer = request.headers.get("referer")
    if referer:
        try:
            parsed = urlparse(referer)
            base = f"{parsed.scheme}://{parsed.netloc}"
            if re.match(settings.CORS_ORIGIN_REGEX, base):
                return base
        except Exception:
            pass
            
    return None
