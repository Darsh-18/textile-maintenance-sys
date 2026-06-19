from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class MachineBase(BaseModel):
    machine_number: str
    name: str
    type: str
    department: str
    installation_date: date
    status: str = "Active"
    notes: Optional[str] = None

class MachineCreate(MachineBase):
    pass

class MachineResponse(MachineBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ServiceBase(BaseModel):
    service_name: str
    description: Optional[str] = None
    interval_days: int
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PartBase(BaseModel):
    part_name: str
    part_number: str
    description: Optional[str] = None
    is_active: bool = True

class PartCreate(PartBase):
    pass

class PartResponse(PartBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class VendorBase(BaseModel):
    vendor_name: str
    contact_person: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MaintenanceItemCreate(BaseModel):
    service_id: int

class MaintenanceSessionCreate(BaseModel):
    machine_id: int
    remarks: Optional[str] = None
    items: List[int] # List of service_ids

class MaintenanceItemResponse(BaseModel):
    id: int
    service: ServiceResponse
    model_config = ConfigDict(from_attributes=True)

class MaintenanceSessionResponse(BaseModel):
    id: int
    machine_id: int
    machine: MachineResponse
    worker: UserResponse
    date: datetime
    remarks: Optional[str] = None
    is_edited: bool = False
    items: List[MaintenanceItemResponse]
    model_config = ConfigDict(from_attributes=True)

class RepairRequestBase(BaseModel):
    machine_id: int
    part_id: Optional[int] = None
    vendor_id: Optional[int] = None
    quantity: Optional[int] = 1
    sent_date: date
    expected_return_date: Optional[date] = None
    status: str = "Sent for Repair"
    remarks: Optional[str] = None
    cost: Optional[str] = None
    invoice_number: Optional[str] = None
    completion_date: Optional[date] = None

class RepairRequestCreate(RepairRequestBase):
    pass

class RepairRequestResponse(RepairRequestBase):
    id: int
    machine: MachineResponse
    part: Optional[PartResponse] = None
    vendor: Optional[VendorResponse] = None
    model_config = ConfigDict(from_attributes=True)

class DowntimeRecordBase(BaseModel):
    machine_id: int
    repair_request_id: Optional[int] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    reason: str

class DowntimeRecordCreate(DowntimeRecordBase):
    pass

class DowntimeRecordResponse(DowntimeRecordBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
