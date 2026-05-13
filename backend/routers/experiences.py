from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user
import models, schemas

router = APIRouter(prefix="/experiences", tags=["experiences"])

@router.get("/", response_model=List[schemas.ExperienceResponse])
def get_experiences(db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    return db.query(models.Experience).filter(models.Experience.user_id == current_user.id).all()

@router.post("/", response_model=schemas.ExperienceResponse)
def create_experience(body: schemas.ExperienceCreate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    exp = models.Experience(**body.model_dump(), user_id=current_user.id)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.put("/{exp_id}", response_model=schemas.ExperienceResponse)
def update_experience(exp_id: int, body: schemas.ExperienceUpdate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    exp = db.query(models.Experience).filter(
        models.Experience.id == exp_id,
        models.Experience.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="경험을 찾을 수 없습니다")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/{exp_id}")
def delete_experience(exp_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    exp = db.query(models.Experience).filter(
        models.Experience.id == exp_id,
        models.Experience.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="경험을 찾을 수 없습니다")
    db.delete(exp)
    db.commit()
    return {"message": "삭제되었습니다"}
