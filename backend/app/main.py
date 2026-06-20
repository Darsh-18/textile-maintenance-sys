from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Textile Maintenance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

from seed import reset_and_seed_data

@app.get("/")
def read_root():
    return {"message": "Welcome to the Textile Maintenance API"}

@app.get("/api/seed")
def seed_database():
    try:
        reset_and_seed_data()
        return {"message": "Database successfully seeded from the cloud!"}
    except Exception as e:
        return {"error": str(e)}

from .routers import auth, machines, services, parts, vendors, maintenance, repairs, dashboard

app.include_router(auth.router)
app.include_router(machines.router)
app.include_router(services.router)


from sqlalchemy import text
from .database import engine

def apply_migrations():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE repair_requests ADD COLUMN cost VARCHAR;"))
    except: pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE repair_requests ADD COLUMN invoice_number VARCHAR;"))
    except: pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE repair_requests ADD COLUMN completion_date DATE;"))
    except: pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_machine_number_key;"))
    except: pass
    try:
        with engine.begin() as conn:
            conn.execute(text("DROP INDEX IF EXISTS ix_machines_machine_number;"))
            conn.execute(text("CREATE INDEX ix_machines_machine_number ON machines (machine_number);"))
    except: pass
    
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS service_code VARCHAR;"))
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';"))
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 15;"))
    except: pass

    # Seed master data
    seed_master_data()

def seed_master_data():
    from .database import SessionLocal
    from .models import ServiceMaster, PartMaster
    
    services_data = [
        {"code": "LUB-001", "name": "Shuttle Oil Change", "cat": "Lubrication", "desc": "Replacing or refilling lubricating oil in the shuttle mechanism to ensure smooth movement and reduce wear."},
        {"code": "LUB-002", "name": "Needle Oil Change", "cat": "Lubrication", "desc": "Replacing lubricating oil for the needle assembly to maintain proper operation and reduce friction."},
        {"code": "LUB-003", "name": "Needle Cam Box Oil Change", "cat": "Lubrication", "desc": "Changing oil in the needle cam box mechanism to ensure smooth cam movement and prevent excessive wear."},
        {"code": "LUB-004", "name": "Frame Greasing X", "cat": "Lubrication", "desc": "Applying grease to X-axis frame movement components to reduce friction and extend component life."},
        {"code": "LUB-005", "name": "Frame Greasing Y", "cat": "Lubrication", "desc": "Applying grease to Y-axis frame movement components to ensure smooth operation and prevent wear."},
        {"code": "LUB-006", "name": "Frame Gear Box Grease Change", "cat": "Lubrication", "desc": "Replacing gearbox grease to maintain proper lubrication of gears and prevent mechanical failures."},
        {"code": "CLN-001", "name": "Pocket Clean Without Ram Out", "cat": "Cleaning", "desc": "Cleaning the pocket area and removing accumulated dust, fibers, and debris without removing the ram-out assembly."},
        {"code": "INS-001", "name": "Shuttle Box Gauging", "cat": "Inspection & Calibration", "desc": "Checking and adjusting shuttle box dimensions, alignment, and clearances to maintain accurate machine operation."},
        {"code": "PRV-001", "name": "V Drive Service", "cat": "Preventive Maintenance", "desc": "Inspection, cleaning, lubrication, adjustment, and maintenance of the V-drive mechanism for efficient power transmission."},
        {"code": "PRV-002", "name": "Borer Drive Service", "cat": "Preventive Maintenance", "desc": "Inspection and servicing of the borer drive mechanism including cleaning, lubrication, and adjustment."},
        {"code": "REP-001", "name": "Ram Out Change", "cat": "Component Replacement", "desc": "Removing and replacing the ram-out component when worn, damaged, or no longer functioning correctly."},
        {"code": "REP-002", "name": "Needle Ram Bush Change", "cat": "Component Replacement", "desc": "Replacing the needle ram bush when worn to maintain alignment, precision, and smooth movement."},
        {"code": "REP-003", "name": "Guide Plate Change", "cat": "Component Replacement", "desc": "Replacing a worn or damaged guide plate to ensure proper material guidance and machine performance."},
        {"code": "REP-004", "name": "Moving Plate Change", "cat": "Component Replacement", "desc": "Replacing a moving plate that has become worn, damaged, or misaligned during operation."},
        {"code": "REP-005", "name": "Dumper Replace", "cat": "Component Replacement", "desc": "Replacing the dumper component to restore proper shock absorption, damping, and machine stability."}
    ]
    
    parts_data = [
        {"name": "Guide Plate", "num": "P-001"},
        {"name": "Moving Plate", "num": "P-002"},
        {"name": "Needle Ram Bush", "num": "P-003"},
        {"name": "Dumper", "num": "P-004"},
        {"name": "Shuttle Box", "num": "P-005"},
        {"name": "Ram Out Assembly", "num": "P-006"},
        {"name": "Gear Box", "num": "P-007"},
        {"name": "Bearing", "num": "P-008"},
        {"name": "Needle Cam Box", "num": "P-009"},
        {"name": "V Drive Assembly", "num": "P-010"},
        {"name": "Borer Drive Assembly", "num": "P-011"}
    ]

    db = SessionLocal()
    try:
        for s in services_data:
            exists = db.query(ServiceMaster).filter(ServiceMaster.service_name == s["name"]).first()
            if not exists:
                db.add(ServiceMaster(
                    service_code=s["code"],
                    service_name=s["name"],
                    category=s["cat"],
                    description=s["desc"],
                    interval_days=30,
                    estimated_duration=15
                ))
            else:
                exists.category = s["cat"]
                exists.service_code = s["code"]
                exists.description = s["desc"]
        
        for p in parts_data:
            exists = db.query(PartMaster).filter(PartMaster.part_name == p["name"]).first()
            if not exists:
                db.add(PartMaster(
                    part_name=p["name"],
                    part_number=p["num"],
                    description=f"Default {p['name']}"
                ))
                
        db.commit()
    finally:
        db.close()

# Run migrations automatically on startup
apply_migrations()

@app.get("/api/migrate-repairs")
def migrate_repairs():
    apply_migrations()
    return {"message": "Migration complete"}

@app.get("/api/seed-machines")
def seed_machines():
    from .database import SessionLocal
    from .models import Machine
    from datetime import date
    
    machines_data = [
        # 106 series
        {"machine_number": "M-7", "name": "106"},
        {"machine_number": "Air Compressor", "name": "106"},
        {"machine_number": "Digi Set", "name": "106"},
        {"machine_number": "AC Plant 1", "name": "106"},
        {"machine_number": "AC Plant 2", "name": "106"},
        {"machine_number": "UPS 1", "name": "106"},
        {"machine_number": "UPS 2", "name": "106"},
        {"machine_number": "Lift", "name": "106"},
        
        # 3508 series
        {"machine_number": "M-1", "name": "3508"},
        {"machine_number": "M-2", "name": "3508"},
        {"machine_number": "M-3", "name": "3508"},
        {"machine_number": "M-4", "name": "3508"},
        {"machine_number": "M-5", "name": "3508"},
        {"machine_number": "M-6", "name": "3508"},
        {"machine_number": "M-7", "name": "3508"},
        {"machine_number": "M-8", "name": "3508"},
        {"machine_number": "M-9", "name": "3508"},
        {"machine_number": "M-10", "name": "3508"},
        {"machine_number": "M-11", "name": "3508"},
        {"machine_number": "M-12", "name": "3508"},
        {"machine_number": "M-13", "name": "3508"},
        {"machine_number": "M-14", "name": "3508"},
        {"machine_number": "M-15", "name": "3508"},
        {"machine_number": "M-16", "name": "3508"},
        {"machine_number": "Air Compressor", "name": "3508"},
        {"machine_number": "AC 1", "name": "3508"},
        {"machine_number": "AC 2", "name": "3508"},
        {"machine_number": "AC 3", "name": "3508"},
        {"machine_number": "AC 4", "name": "3508"},
        {"machine_number": "AC 5", "name": "3508"},
        {"machine_number": "UPS 1", "name": "3508"},
        {"machine_number": "UPS 2", "name": "3508"},
        {"machine_number": "Sample Machine", "name": "3508"},
        {"machine_number": "Digi Set", "name": "3508"},
        {"machine_number": "Lift", "name": "3508"},
        
        # 108 series
        {"machine_number": "M-1", "name": "108"},
        {"machine_number": "M-2", "name": "108"},
        {"machine_number": "M-3", "name": "108"},
        {"machine_number": "M-4", "name": "108"},
        {"machine_number": "M-5", "name": "108"},
        {"machine_number": "M-6", "name": "108"},
        {"machine_number": "M-7", "name": "108"},
        {"machine_number": "M-8", "name": "108"},
        {"machine_number": "Air Compressor", "name": "108"},
        {"machine_number": "UPS", "name": "108"},
        {"machine_number": "AC", "name": "108"},
        {"machine_number": "Lift", "name": "108"}
    ]
    
    db = SessionLocal()
    count = 0
    try:
        for m_data in machines_data:
            exists = db.query(Machine).filter(
                Machine.machine_number == m_data["machine_number"],
                Machine.name == m_data["name"]
            ).first()
            
            if not exists:
                new_machine = Machine(
                    machine_number=m_data["machine_number"],
                    name=m_data["name"],
                    type="Textile",
                    department="Production",
                    installation_date=date.today(),
                    status="Active"
                )
                db.add(new_machine)
                count += 1
        db.commit()
        return {"message": f"Successfully added {count} machines!"}
    finally:
        db.close()

app.include_router(parts.router)
app.include_router(vendors.router)
app.include_router(maintenance.router)
app.include_router(repairs.router)
app.include_router(dashboard.router)
