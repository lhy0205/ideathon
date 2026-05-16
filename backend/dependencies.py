from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import Optional


def get_current_user(
    x_session_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    if not x_session_token:
        raise HTTPException(status_code=401, detail="세션 토큰이 없습니다")
    user = db.query(models.User).filter(models.User.session_token == x_session_token).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="유효하지 않은 세션입니다")
    return user
