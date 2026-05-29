from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import SessionLocal

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def get_transactions(db: Session = Depends(get_db)):

    result = db.execute(text("SELECT description FROM exp"))

    rows = result.fetchall()

    descriptions = []

    for row in rows:
        descriptions.append(row[0])

    return descriptions