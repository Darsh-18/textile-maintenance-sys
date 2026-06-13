from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    SUPERVISOR = "Supervisor"
    WORKER = "Maintenance Worker"

class RepairStatusEnum(str, enum.Enum):
    SENT = "Sent for Repair"
    UNDER_REPAIR = "Under Repair"
    READY = "Ready for Collection"
    RETURNED = "Returned"
    INSTALLED = "Installed"
    CLOSED = "Closed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=RoleEnum.WORKER.value)
    is_active = Column(Boolean, default=True)

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_number = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String)
    department = Column(String)
    installation_date = Column(Date)
    status = Column(String, default="Active")
    notes = Column(Text, nullable=True)

    maintenance_sessions = relationship("MaintenanceSession", back_populates="machine", cascade="all, delete-orphan")
    repair_requests = relationship("RepairRequest", back_populates="machine", cascade="all, delete-orphan")
    downtimes = relationship("DowntimeRecord", back_populates="machine", cascade="all, delete-orphan")

class ServiceMaster(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    interval_days = Column(Integer)
    is_active = Column(Boolean, default=True)

class PartMaster(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    part_name = Column(String)
    part_number = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_name = Column(String)
    contact_person = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

class MaintenanceSession(Base):
    __tablename__ = "maintenance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    worker_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text, nullable=True)
    is_edited = Column(Boolean, default=False)

    machine = relationship("Machine", back_populates="maintenance_sessions")
    worker = relationship("User")
    items = relationship("MaintenanceItem", back_populates="session", cascade="all, delete-orphan")

class MaintenanceItem(Base):
    __tablename__ = "maintenance_items"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("maintenance_sessions.id"))
    service_id = Column(Integer, ForeignKey("services.id"))

    session = relationship("MaintenanceSession", back_populates="items")
    service = relationship("ServiceMaster")

class RepairRequest(Base):
    __tablename__ = "repair_requests"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    part_id = Column(Integer, ForeignKey("parts.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    quantity = Column(Integer, default=1)
    sent_date = Column(Date)
    expected_return_date = Column(Date, nullable=True)
    status = Column(String, default=RepairStatusEnum.SENT.value)
    remarks = Column(Text, nullable=True)

    machine = relationship("Machine", back_populates="repair_requests")
    part = relationship("PartMaster")
    vendor = relationship("Vendor")
    downtimes = relationship("DowntimeRecord", back_populates="repair_request")

class DowntimeRecord(Base):
    __tablename__ = "downtime_records"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    repair_request_id = Column(Integer, ForeignKey("repair_requests.id"), nullable=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    reason = Column(Text)

    machine = relationship("Machine", back_populates="downtimes")
    repair_request = relationship("RepairRequest", back_populates="downtimes")
