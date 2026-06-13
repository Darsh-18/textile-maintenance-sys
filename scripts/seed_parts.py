import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import PartMaster, Vendor

db = SessionLocal()
if not db.query(PartMaster).first():
    db.add_all([
        PartMaster(part_number="PT-101", part_name="RAM Bush"),
        PartMaster(part_number="PT-102", part_name="Moving Plate"),
        PartMaster(part_number="PT-103", part_name="Y Cam Box")
    ])
if not db.query(Vendor).first():
    db.add_all([
        Vendor(vendor_name="Textile Spares India", contact_person="Ramesh", mobile="9876543210"),
        Vendor(vendor_name="Global Machinery Parts", contact_person="Suresh", mobile="9123456789")
    ])
db.commit()
db.close()
