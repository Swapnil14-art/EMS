from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate, ClubOut

router = APIRouter()


@router.get("/", response_model=List[ClubOut])
async def list_clubs(
    department_id: Optional[int] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Club)
    if department_id:
        query = query.where(Club.department_id == department_id)
    if active_only:
        query = query.where(Club.is_active == True)  # noqa: E712
    query = query.order_by(Club.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{club_id}", response_model=ClubOut)
async def get_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    club = await db.get(Club, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@router.post("/", response_model=ClubOut, status_code=201)
async def create_club(
    body: ClubCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    club = Club(
        name=body.name,
        description=body.description,
        department_id=body.department_id,
        coordinator_id=body.coordinator_id,
    )
    db.add(club)
    await db.commit()
    await db.refresh(club)
    return club


@router.patch("/{club_id}", response_model=ClubOut)
async def update_club(
    club_id: int,
    body: ClubUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    club = await db.get(Club, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(club, field, value)
    await db.commit()
    await db.refresh(club)
    return club


@router.patch("/{club_id}/deactivate")
async def deactivate_club(
    club_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    club = await db.get(Club, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    club.is_active = False
    await db.commit()
    return {"message": f"Club '{club.name}' deactivated"}
