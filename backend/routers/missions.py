from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from dependencies import get_current_user
import models, schemas, os, aiofiles, uuid

router = APIRouter(prefix="/missions", tags=["missions"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

@router.get("/", response_model=List[schemas.MissionResponse])
def get_missions(db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    return db.query(models.Mission).filter(models.Mission.user_id == current_user.id).all()

@router.post("/", response_model=schemas.MissionResponse)
def create_mission(body: schemas.MissionCreate,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    mission = models.Mission(**body.model_dump(), user_id=current_user.id)
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission

@router.put("/{mission_id}/complete", response_model=schemas.MissionResponse)
def complete_mission(mission_id: int,
                     db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    mission = db.query(models.Mission).filter(
        models.Mission.id == mission_id,
        models.Mission.user_id == current_user.id
    ).first()
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
    mission.completed = True
    mission.completed_at = datetime.utcnow()
    mission.streak += 1
    db.commit()
    db.refresh(mission)
    _create_notification(db, current_user.id, f"'{mission.title}' 미션을 완료했습니다! 🎉")
    return mission

@router.post("/{mission_id}/image", response_model=schemas.MissionResponse)
async def upload_mission_image(mission_id: int, file: UploadFile = File(...),
                                db: Session = Depends(get_db),
                                current_user: models.User = Depends(get_current_user)):
    mission = db.query(models.Mission).filter(
        models.Mission.id == mission_id,
        models.Mission.user_id == current_user.id
    ).first()
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    mission.image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(mission)
    return mission

@router.delete("/{mission_id}")
def delete_mission(mission_id: int, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    mission = db.query(models.Mission).filter(
        models.Mission.id == mission_id,
        models.Mission.user_id == current_user.id
    ).first()
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
    db.delete(mission)
    db.commit()
    return {"message": "삭제되었습니다"}

def _create_notification(db, user_id, message):
    notif = models.Notification(user_id=user_id, message=message, type="mission")
    db.add(notif)
    db.commit()
