from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from dependencies import get_current_user
import models, secrets

router = APIRouter(prefix="/auth", tags=["auth"])


class SessionStartResponse(BaseModel):
    session_token: str


@router.post("/session/start", response_model=SessionStartResponse)
def session_start(db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(32)
    user = models.User(session_token=token)
    db.add(user)
    db.commit()
    db.refresh(user)
    return SessionStartResponse(session_token=token)


@router.post("/session/end")
def session_end(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    db.query(models.MissionLog).filter(models.MissionLog.user_id == user_id).delete()
    db.query(models.StarLetter).filter(models.StarLetter.user_id == user_id).delete()
    db.query(models.AnalysisResult).filter(models.AnalysisResult.user_id == user_id).delete()
    db.query(models.Mission).filter(models.Mission.user_id == user_id).delete()
    db.query(models.Experience).filter(models.Experience.user_id == user_id).delete()
    db.query(models.UserExperience).filter(models.UserExperience.user_id == user_id).delete()
    db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()
    db.query(models.CertProof).filter(models.CertProof.user_id == user_id).delete()
    db.query(models.User).filter(models.User.id == user_id).delete()
    db.commit()

    return {"message": "세션이 종료되었습니다"}
