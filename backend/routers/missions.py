from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import datetime

from database import get_db
from dependencies import get_current_user
from rag.exaone_client import analyze
from cloudinary_utils import upload_file
import models, schemas

router = APIRouter(prefix="/missions", tags=["missions"])


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


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    """날짜별 미션 완료 기록 반환 — Mission.completed_at 기준"""
    rows = (
        db.query(
            cast(models.Mission.completed_at, Date).label("date"),
            func.count(models.Mission.id).label("count"),
        )
        .filter(
            models.Mission.user_id == current_user.id,
            models.Mission.completed == True,
            models.Mission.completed_at.isnot(None),
        )
        .group_by(cast(models.Mission.completed_at, Date))
        .order_by(cast(models.Mission.completed_at, Date))
        .all()
    )
    return {"heatmap": [{"date": str(r.date), "count": r.count} for r in rows]}


@router.get("/recommend")
async def recommend_missions(db: Session = Depends(get_db),
                              current_user: models.User = Depends(get_current_user)):
    """유저 프로필 기반 EXAONE 미션 추천"""
    user = current_user
    profile_summary = (
        f"이름: {user.name}\n"
        f"관심 직무: {user.job_interest or '미입력'}\n"
        f"공백 시작일: {user.gap_start_date or '미입력'}"
    )
    prompt = (
        f"다음은 취업 준비 중인 사용자의 프로필입니다.\n{profile_summary}\n\n"
        "이 사용자에게 적합한 자기계발 미션 5가지를 추천해 주세요.\n"
        "각 미션은 제목과 설명을 포함하고, 아래 JSON 배열 형식으로만 응답하세요.\n"
        '[{"title":"미션 제목","content":"미션 설명","mission_type":"유형"}]'
    )
    raw = await analyze(prompt)

    import json, re
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        missions = json.loads(match.group()) if match else []
    except Exception:
        missions = []

    return {"recommendations": missions}


@router.post("/{mission_id}/verify", response_model=schemas.MissionResponse)
async def verify_mission(mission_id: int,
                          body: schemas.MissionVerifyRequest,
                          file: Optional[UploadFile] = File(None),
                          db: Session = Depends(get_db),
                          current_user: models.User = Depends(get_current_user)):
    """텍스트/이미지 → EXAONE 인증 판단 → verified 업데이트"""
    mission = db.query(models.Mission).filter(
        models.Mission.id == mission_id,
        models.Mission.user_id == current_user.id
    ).first()
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")

    evidence_parts = [f"미션 제목: {mission.title}"]

    if body.text:
        evidence_parts.append(f"사용자 인증 텍스트: {body.text}")

    image_desc = ""
    if file:
        mission.image_url = upload_file(await file.read(), folder="mission_verify")
        image_desc = "사용자가 인증 이미지를 첨부했습니다."
        evidence_parts.append(image_desc)

    evidence = "\n".join(evidence_parts)
    prompt = (
        f"다음은 사용자가 미션 완료를 인증하는 내용입니다.\n{evidence}\n\n"
        "이 내용이 미션 완료의 증거로 충분한지 판단하세요.\n"
        "충분하면 '인증완료', 부족하면 '인증실패'로 시작하는 한 문장으로만 답하세요."
    )
    result = await analyze(prompt)

    verified = result.strip().startswith("인증완료")
    mission.verified = verified
    mission.verification_note = result.strip()
    if verified:
        mission.verified_at = datetime.utcnow()

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

    now = datetime.utcnow()
    mission.completed = True
    mission.completed_at = now
    mission.streak += 1

    log = models.MissionLog(
        mission_id=mission.id,
        user_id=current_user.id,
        completed_at=now,
        note=mission.title,
    )
    db.add(log)
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
    mission.image_url = upload_file(await file.read(), folder="mission_images")
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
