from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database, auth
from datetime import datetime

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

@router.post("/", response_model=schemas.MaintenanceSessionResponse)
def create_maintenance_session(
    session_data: schemas.MaintenanceSessionCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth.get_current_active_user)
):
    db_session = models.MaintenanceSession(
        machine_id=session_data.machine_id,
        worker_id=user.id,
        remarks=session_data.remarks,
        date=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    for service_id in session_data.items:
        db_item = models.MaintenanceItem(
            session_id=db_session.id,
            service_id=service_id
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[schemas.MaintenanceSessionResponse])
def get_maintenance_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.MaintenanceSession).order_by(models.MaintenanceSession.date.desc()).offset(skip).limit(limit).all()

@router.put("/{session_id}", response_model=schemas.MaintenanceSessionResponse)
def update_maintenance_session(
    session_id: int,
    session_data: schemas.MaintenanceSessionCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(auth.get_current_active_user)
):
    db_session = db.query(models.MaintenanceSession).filter(models.MaintenanceSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db_session.machine_id = session_data.machine_id
    db_session.remarks = session_data.remarks
    db_session.is_edited = True
    
    # Update items: delete old ones and insert new ones
    db.query(models.MaintenanceItem).filter(models.MaintenanceItem.session_id == session_id).delete()
    
    for service_id in session_data.items:
        db_item = models.MaintenanceItem(
            session_id=db_session.id,
            service_id=service_id
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_session)
    return db_session
