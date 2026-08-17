from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://trialgo_user:trialgo_pass@localhost:5432/trialgo")

connect_args = {}
pool_class = None  # Use SQLAlchemy default pool

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "neon.tech" in DATABASE_URL:
    # Neon serverless pooler handles connection pooling externally.
    # SQLAlchemy must use NullPool to avoid double-pooling conflicts.
    pool_class = NullPool

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,  # Reconnect stale connections
}

if pool_class is not None:
    engine_kwargs["poolclass"] = pool_class

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
