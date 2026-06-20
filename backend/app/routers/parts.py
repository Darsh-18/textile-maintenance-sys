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

@router.put("/{part_id}", response_model=schemas.PartResponse)
def update_part(part_id: int, part: schemas.PartCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin"]))):
    db_part = db.query(models.PartMaster).filter(models.PartMaster.id == part_id).first()
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    for key, value in part.model_dump().items():
        setattr(db_part, key, value)
        
    db.commit()
    db.refresh(db_part)
    return db_part

@router.delete("/{part_id}")
def delete_part(part_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin"]))):
    db_part = db.query(models.PartMaster).filter(models.PartMaster.id == part_id).first()
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Check if part has historical usage
    items_count = db.query(models.RepairRequest).filter(models.RepairRequest.part_id == part_id).count()
    if items_count > 0:
        db_part.is_active = False # Soft delete
    else:
        db.delete(db_part)
        
    db.commit()
    return {"message": "Part deleted successfully"}
