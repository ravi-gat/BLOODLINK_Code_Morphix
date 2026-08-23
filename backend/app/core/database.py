"""
SQLAlchemy database engine and session factory.
All database access goes through the get_db dependency.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from .config import settings
import logging
from urllib.parse import urlparse, unquote

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _create_engine_from_url(url: str):
    """Parse database URL and create engine with proper password handling."""
    parsed = urlparse(url)
    
    # Extract and properly decode password if URL-encoded
    password = parsed.password
    if password and '%' in password:
        try:
            password = unquote(password)
        except Exception:
            pass
    
    # Use create_engine with explicit connection kwargs for better password handling
    from sqlalchemy.engine import URL
    
    db_url = URL.create(
        drivername=parsed.scheme,
        username=parsed.username,
        password=password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip('/')
    )
    
    return create_engine(
        db_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )


# Create engine
engine = _create_engine_from_url(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    FastAPI dependency that yields a database session.
    Session is closed automatically after the request.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
