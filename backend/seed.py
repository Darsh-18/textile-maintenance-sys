import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import User, Machine, ServiceMaster, PartMaster, Vendor, RoleEnum, MaintenanceSession, MaintenanceItem, RepairRequest, DowntimeRecord
from app.auth import get_password_hash

def reset_and_seed_data():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).filter_by(username="admin").first():
        db.close()
        return
    
    # 3. Seed Users
    admin = User(username="admin", hashed_password=get_password_hash("admin123"), role=RoleEnum.ADMIN.value)
    worker = User(username="worker", hashed_password=get_password_hash("worker123"), role=RoleEnum.WORKER.value)
    db.add_all([admin, worker])
    db.commit()

    # 4. Seed Machines (1 to 16) based on the "3508" header
    machines = []
    for i in range(1, 17):
        machines.append(
            Machine(
                machine_number=f"M/C NO {i}",
                name="3508",
                type="Embroidery/Textile",
                department="Production",
                installation_date=datetime(2019, 1, 1).date(),
                status="Active"
            )
        )
    db.add_all(machines)
    db.commit()

    # 5. Seed Services from the provided Excel/Paper sheets
    service_names = [
        "SHUTTLE OIL CHANGE",
        "NEEDLE OIL CHANGE",
        "RAM OUT CHANGE",
        "POCKET CLEAN WITHOUT RAM OUT",
        "V DRIVE SERVICE",
        "FRAME GREESING - X",
        "FRAME GREESING - Y",
        "FRAME GEAR BOX GREASE CHANGE",
        "BORER DRIVE SERVICE",
        "NEEDLE RAM BUSH CHANGE",
        "SHUTTLE BOX GAUGEING",
        "GUIDE PLATE CHANGE",
        "MOVING PLATE CHANGE",
        "DUMPER REPLACE",
        "SEQUINS ATTACHMENT MOVE"
    ]
    
    services = []
    for name in service_names:
        services.append(
            ServiceMaster(
                service_name=name,
                description=f"{name} maintenance",
                interval_days=30, # Default interval
                is_active=True
            )
        )
    db.add_all(services)
    db.commit()

    # 6. Recreate Maintenance Sessions from the Checklist images
    # We'll map the 'v' checkmarks to actual maintenance items for each machine.
    # Map index matches the service_names list above (0-indexed).
    
    # Define checkmarks (True for 'v', False for 'x' or empty)
    # Using Image 2 and Image 3 analysis:
    checkmarks = {
        1:  [True, True, False, False, False, True, True, True, True, True, True, True, True, False],
        2:  [False, True, False, False, False, True, True, True, True, True, True, True, True, False],
        3:  [True, True, False, False, False, True, True, True, True, True, True, True, True, False],
        4:  [False, True, False, False, False, True, True, True, True, True, True, True, True, False],
        5:  [False, True, False, False, False, True, True, True, True, True, True, False, True, True],
        6:  [False, True, False, False, False, True, True, True, True, True, True, True, True, False],
        7:  [False, True, False, False, False, True, True, True, True, True, True, False, True, False],
        8:  [False, True, False, False, False, True, True, True, True, True, True, False, True, False],
        9:  [False, True, False, False, True, True, True, True, True, True, True, True, True, True],
        10: [False, True, False, False, True, True, True, True, True, True, True, False, True, False],
        11: [False, True, False, False, True, True, True, True, True, True, False, True, True, True],
        12: [False, True, False, False, True, True, True, True, True, True, False, True, True, True],
        13: [False, True, False, False, True, True, True, False, True, True, False, True, True, True],
        14: [False, True, False, False, True, True, True, False, True, True, False, True, True, True],
        15: [False, True, False, False, True, True, True, False, True, True, False, True, True, True],
        16: [False, True, False, False, True, True, True, True, True, True, False, True, True, False],
    }

    # Custom dates mapped from Image 1 for M/C 1 to M/C 8
    # We will use the main past date for each machine.
    dates = {
        1: datetime(2019, 7, 22),
        2: datetime(2019, 8, 15),
        3: datetime(2021, 4, 24),
        4: datetime(2024, 3, 15),
        5: datetime(2025, 9, 1),
        6: datetime(2020, 10, 2),
        7: datetime(2021, 1, 27),
        8: datetime(2021, 8, 13),
    }

    for mc_id, marks in checkmarks.items():
        session_date = dates.get(mc_id, datetime(2024, 1, 1)) # Default date if not in Image 1
        
        session = MaintenanceSession(
            machine_id=mc_id,
            worker_id=worker.id,
            date=session_date,
            remarks="Historical data imported from paper records."
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        items_to_add = []
        for s_idx, is_checked in enumerate(marks):
            if is_checked:
                # service_id is s_idx + 1 because IDs start at 1
                items_to_add.append(
                    MaintenanceItem(
                        session_id=session.id,
                        service_id=s_idx + 1
                    )
                )
        db.add_all(items_to_add)
        db.commit()

    db.close()
    print("Previous data removed and new data seeded successfully.")

if __name__ == "__main__":
    reset_and_seed_data()
