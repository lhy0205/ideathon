from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models, schemas

router = APIRouter(prefix="/report-settings", tags=["report-settings"])


@router.get("/", response_model=schemas.ReportSettingsResponse)
def get_report_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """내 성장 리포트 섹션 설정 조회 (없으면 기본값 반환)"""
    settings = db.query(models.ReportSettings).filter(
        models.ReportSettings.user_id == current_user.id
    ).first()
    if not settings:
        settings = models.ReportSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/", response_model=schemas.ReportSettingsResponse)
def update_report_settings(
    body: schemas.ReportSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """성장 리포트 섹션 설정 저장"""
    settings = db.query(models.ReportSettings).filter(
        models.ReportSettings.user_id == current_user.id
    ).first()
    if not settings:
        settings = models.ReportSettings(user_id=current_user.id)
        db.add(settings)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
