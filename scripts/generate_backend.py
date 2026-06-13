import os

ROUTERS_DIR = "backend/app/routers"

routers_code = {
    "machines.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "services.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "parts.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "vendors.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "maintenance.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "repairs.py": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "dashboard.py": """from fastapi import APIRouter, Depends
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
"""
}

for filename, content in routers_code.items():
    path = os.path.join(ROUTERS_DIR, filename)
    with open(path, "w") as f:
        f.write(content)

# Update main.py to include these routers
main_py_path = "backend/app/main.py"
with open(main_py_path, "r") as f:
    main_content = f.read()

router_imports = """
from .routers import auth, machines, services, parts, vendors, maintenance, repairs, dashboard

app.include_router(auth.router)
app.include_router(machines.router)
app.include_router(services.router)
app.include_router(parts.router)
app.include_router(vendors.router)
app.include_router(maintenance.router)
app.include_router(repairs.router)
app.include_router(dashboard.router)
"""

if "app.include_router" not in main_content:
    with open(main_py_path, "a") as f:
        f.write(router_imports)
        
print("Routers generated successfully.")
