from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/", response_model=List[schemas.ServiceResponse])
def get_services(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.ServiceMaster).filter(models.ServiceMaster.is_active == True).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.ServiceResponse)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin", "Supervisor"]))):
    db_service = models.ServiceMaster(**service.model_dump())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(database.get_db), user: models.User = Depends(auth.require_role(["Admin"]))):
    db_service = db.query(models.ServiceMaster).filter(models.ServiceMaster.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if service has historical usage
    items_count = db.query(models.MaintenanceItem).filter(models.MaintenanceItem.service_id == service_id).count()
    if items_count > 0:
        db_service.is_active = False # Soft delete to preserve history
    else:
        db.delete(db_service) # Hard delete
        
    db.commit()
    return {"message": "Service deleted successfully"}
