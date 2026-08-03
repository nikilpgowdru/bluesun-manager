from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import shutil

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, 'bluesun.db')
CLOUD_MIRROR = os.path.join(DB_DIR, 'bluesun_cloud_persistent_backup.db')

# Auto-restore from persistent cloud mirror if main db is missing
if not os.path.exists(DB_FILE) and os.path.exists(CLOUD_MIRROR):
    shutil.copy2(CLOUD_MIRROR, DB_FILE)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def sync_cloud_backup():
    """Create instant persistent cloud mirror copy on disk."""
    try:
        if os.path.exists(DB_FILE):
            shutil.copy2(DB_FILE, CLOUD_MIRROR)
    except Exception as e:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        sync_cloud_backup()
        db.close()

