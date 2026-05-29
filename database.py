from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = "postgresql://amilaminjamal:123456@localhost:5432/expense"
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit = False, autoflush=False,bind=engine)