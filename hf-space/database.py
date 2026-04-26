import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# /data persists across HF Space rebuilds; /tmp is wiped on every restart
_default_db = "sqlite:////data/tts_app.db" if os.path.isdir("/data") else "sqlite:////tmp/tts_app.db"
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", _default_db)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
