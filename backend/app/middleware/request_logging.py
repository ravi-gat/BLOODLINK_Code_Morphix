"""
Structured request logging and correlation ID middleware.
Provides auditability, performance measurement, and request tracing without logging sensitive data.
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("bloodlink.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Generate correlation / request ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4()).replace("-", "")
        request.state.request_id = request_id

        start_time = time.perf_counter()

        # Execute request
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            client_ip = request.client.host if request.client else "unknown"
            logger.error(
                f"REQ_FAIL | id={request_id} | {request.method} {request.url.path} | "
                f"client={client_ip} | duration={duration_ms}ms | error={type(exc).__name__}"
            )
            raise exc

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        client_ip = request.client.host if request.client else "unknown"

        # Attach request ID to response headers
        response.headers["X-Request-ID"] = request_id

        # Skip spamming logs for frequent static/health probes in development if needed
        if request.url.path not in ("/health", "/health/ready"):
            logger.info(
                f"REQ | id={request_id} | {request.method} {request.url.path} | "
                f"status={response.status_code} | duration={duration_ms}ms | client={client_ip}"
            )

        return response
