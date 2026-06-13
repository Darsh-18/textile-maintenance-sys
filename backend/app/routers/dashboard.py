from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, models
from sqlalchemy import func
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(database.get_db)):
    total_machines = db.query(models.Machine).count()
    active_machines = db.query(models.Machine).filter(models.Machine.status == "Active").count()
    
    now = datetime.utcnow()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    maintenance_this_month = db.query(models.MaintenanceSession).filter(models.MaintenanceSession.date >= first_day_of_month).count()
    
    open_repairs = db.query(models.RepairRequest).filter(models.RepairRequest.status != "Closed").count()
    
    return {
        "total_machines": total_machines,
        "active_machines": active_machines,
        "maintenance_this_month": maintenance_this_month,
        "open_repairs": open_repairs
    }
