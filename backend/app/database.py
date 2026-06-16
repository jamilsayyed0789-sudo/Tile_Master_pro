import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
from app.config import DATABASE_URL

logger = logging.getLogger(__name__)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
    )
else:
    # PostgreSQL / Neon serverless: use NullPool or a small QueuePool
    # pool_pre_ping detects stale SSL connections before reuse
    # pool_recycle ensures connections are replaced before Neon's idle timeout
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=60,          # Recycle every 60s — well within Neon's idle timeout
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
    )

    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        connection_record.info["pid"] = id(dbapi_connection)

    @event.listens_for(engine, "checkout")
    def checkout(dbapi_connection, connection_record, connection_proxy):
        """Invalidate connections that have lost their SSL session."""
        prev_pid = connection_record.info.get("pid", None)
        if prev_pid is not None and prev_pid != id(dbapi_connection):
            connection_record.info["pid"] = id(dbapi_connection)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
