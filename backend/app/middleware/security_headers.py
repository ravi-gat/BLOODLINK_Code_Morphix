"""
Security headers middleware for BloodLink API.
Enforces defense-in-depth HTTP security headers compatible with Google OAuth and OpenStreetMap.
"""
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response: Response = await call_next(request)

        # Standard defense-in-depth security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"

        # Content Security Policy (Compatible with Google OAuth, Leaflet OSM, Fonts)
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
            "connect-src 'self' https://accounts.google.com https://*.tile.openstreetmap.org https://unpkg.com http://localhost:8000 http://127.0.0.1:8000 http://localhost:5173 http://127.0.0.1:5173 ws://localhost:5173",
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://lh3.googleusercontent.com https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "frame-src 'self' https://accounts.google.com",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # HSTS for HTTPS requests
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
