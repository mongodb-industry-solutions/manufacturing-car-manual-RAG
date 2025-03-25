from typing import Generator
import logging

from app.db.mongodb import get_mongodb

logger = logging.getLogger(__name__)

def get_db() -> Generator:
    """Get database connection as a dependency"""
    db = get_mongodb()
    try:
        yield db
    finally:
        # No need to close connection here due to singleton pattern
        pass
