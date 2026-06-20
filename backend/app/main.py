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
