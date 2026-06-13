from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/", response_model=List[schemas.ServiceResponse])
def get_services(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.ServiceMaster).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.ServiceResponse)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_service = models.ServiceMaster(**service.model_dump())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service
