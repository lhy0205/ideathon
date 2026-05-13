from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user
import models, schemas

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db),
                      current_user: models.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}

@router.put("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "읽음 처리되었습니다"}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "모두 읽음 처리되었습니다"}
