import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

raw_url = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost/textile_maintenance")
if raw_url.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    SQLALCHEMY_DATABASE_URL = raw_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
