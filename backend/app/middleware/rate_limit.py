import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Detect test execution environment
is_testing = (
    os.getenv("TESTING", "").lower() in ("true", "1")
    or os.getenv("PYTEST_CURRENT_TEST") is not None
    or os.getenv("ENVIRONMENT") == "testing"
)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    enabled=not is_testing,
)


async def rate_limit_error_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": "Too many requests. Please slow down and try again shortly.",
            "status_code": 429,
        },
    )
