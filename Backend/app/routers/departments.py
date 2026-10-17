from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut

router = APIRouter()


@router.get("/", response_model=List[DepartmentOut])
async def list_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.get("/{dept_id}", response_model=DepartmentOut)
async def get_department(
    dept_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("/", response_model=DepartmentOut, status_code=201)
async def create_department(
    body: DepartmentCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Department).where(Department.code == body.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Department code already exists")
    dept = Department(name=body.name, code=body.code.upper())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.patch("/{dept_id}", response_model=DepartmentOut)
async def update_department(
    dept_id: int,
    body: DepartmentUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if body.name is not None:
        dept.name = body.name
    if body.code is not None:
        dept.code = body.code.upper()
    await db.commit()
    await db.refresh(dept)
    return dept
