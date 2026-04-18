from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.club import Club
from app.models.event import Event
from app.schemas.club import ClubCreate, ClubUpdate, ClubOut

router = APIRouter()


@router.get("/", response_model=List[ClubOut])
async def list_clubs(
    department_id: Optional[int] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Club).options(selectinload(Club.coordinators))
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
    club = await db.get(Club, club_id, options=[selectinload(Club.coordinators)])
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@router.post("/", response_model=ClubOut, status_code=201)
async def create_club(
    body: ClubCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    coord_id = body.coordinator_id
    if not coord_id and body.coordinator_ids:
        coord_id = body.coordinator_ids[0]

    club = Club(
        name=body.name,
        description=body.description,
        department_id=body.department_id,
        coordinator_id=coord_id,
    )
    db.add(club)
    await db.flush()

    if body.coordinator_ids:
        await db.execute(
            update(User).where(User.id.in_(body.coordinator_ids)).values(club_id=club.id)
        )

    await db.commit()
    await db.refresh(club, ["coordinators"])
    return club


@router.patch("/{club_id}", response_model=ClubOut)
async def update_club(
    club_id: int,
    body: ClubUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    club = await db.get(Club, club_id, options=[selectinload(Club.coordinators)])
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    update_data = body.model_dump(exclude_unset=True)
    if "coordinator_ids" in update_data:
        coordinator_ids_to_set = update_data.pop("coordinator_ids")
        
        if coordinator_ids_to_set and "coordinator_id" not in update_data:
            update_data["coordinator_id"] = coordinator_ids_to_set[0]
        elif not coordinator_ids_to_set and "coordinator_id" not in update_data:
            update_data["coordinator_id"] = None
        
        # Clear out existing bound coordinators
        await db.execute(update(User).where(User.club_id == club.id).values(club_id=None))
        
        # Re-assign new ones
        if coordinator_ids_to_set:
            await db.execute(update(User).where(User.id.in_(coordinator_ids_to_set)).values(club_id=club.id))

    for field, value in update_data.items():
        setattr(club, field, value)
        
    await db.commit()
    await db.refresh(club, ["coordinators"])
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

@router.delete("/{club_id}")
async def delete_club(
    club_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    club = await db.get(Club, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    result = await db.execute(select(Event).where(Event.club_id == club_id).limit(1))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete club. Please delete the events under that club first.")
        
    await db.execute(update(User).where(User.club_id == club.id).values(club_id=None))
    
    await db.delete(club)
    await db.commit()
    return {"message": f"Club '{club.name}' deleted successfully."}
