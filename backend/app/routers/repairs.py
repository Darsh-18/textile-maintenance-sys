from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/repairs", tags=["repairs"])

@router.get("/", response_model=List[schemas.RepairRequestResponse])
def get_repairs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.RepairRequest).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.RepairRequestResponse)
def create_repair(repair: schemas.RepairRequestCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_active_user)):
    db_repair = models.RepairRequest(**repair.model_dump())
    db.add(db_repair)
    db.commit()
    db.refresh(db_repair)
    return db_repair

@router.put("/{repair_id}/status")
def update_repair_status(repair_id: int, status: str, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_repair = db.query(models.RepairRequest).filter(models.RepairRequest.id == repair_id).first()
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair request not found")
    db_repair.status = status
    db.commit()
    return {"message": "Status updated successfully"}

@router.put("/{repair_id}", response_model=schemas.RepairRequestResponse)
def update_repair(repair_id: int, repair: schemas.RepairRequestCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.get_current_active_user)):
    db_repair = db.query(models.RepairRequest).filter(models.RepairRequest.id == repair_id).first()
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair request not found")
    
    for key, value in repair.model_dump().items():
        setattr(db_repair, key, value)
        
    db.commit()
    db.refresh(db_repair)
    return db_repair

@router.delete("/{repair_id}")
def delete_repair(repair_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin"]))):
    db_repair = db.query(models.RepairRequest).filter(models.RepairRequest.id == repair_id).first()
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair request not found")
    
    db.delete(db_repair)
    db.commit()
    return {"message": "Repair request deleted successfully"}
