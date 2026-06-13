from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/parts", tags=["parts"])

@router.get("/", response_model=List[schemas.PartResponse])
def get_parts(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.PartMaster).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.PartResponse)
def create_part(part: schemas.PartCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_part = models.PartMaster(**part.model_dump())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part
