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
app.include_router(parts.router)
app.include_router(vendors.router)
app.include_router(maintenance.router)
app.include_router(repairs.router)
app.include_router(dashboard.router)
