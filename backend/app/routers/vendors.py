from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/vendors", tags=["vendors"])

@router.get("/", response_model=List[schemas.VendorResponse])
def get_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Vendor).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_vendor = models.Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor
