from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/machines", tags=["machines"])

@router.get("/", response_model=List[schemas.MachineResponse])
def get_machines(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Machine).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.MachineResponse)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_machine = models.Machine(**machine.model_dump())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@router.get("/{machine_id}", response_model=schemas.MachineResponse)
def get_machine(machine_id: int, db: Session = Depends(database.get_db)):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return db_machine

@router.put("/{machine_id}", response_model=schemas.MachineResponse)
def update_machine(machine_id: int, machine: schemas.MachineCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    for key, value in machine.model_dump().items():
        setattr(db_machine, key, value)
        
    db.commit()
    db.refresh(db_machine)
    return db_machine

@router.delete("/{machine_id}")
def delete_machine(machine_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin"]))):
    db_machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not db_machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    try:
        # Delete associated records to prevent foreign key constraint failures
        db.query(models.RepairRequest).filter(models.RepairRequest.machine_id == machine_id).delete()
        db.query(models.DowntimeRecord).filter(models.DowntimeRecord.machine_id == machine_id).delete()
        sessions = db.query(models.MaintenanceSession).filter(models.MaintenanceSession.machine_id == machine_id).all()
        for s in sessions:
            db.query(models.MaintenanceItem).filter(models.MaintenanceItem.session_id == s.id).delete()
            db.delete(s)
            
        db.delete(db_machine)
        db.commit()
        return {"message": "Machine and associated records deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to delete machine: {str(e)}")
