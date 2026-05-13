from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models, schemas


router = APIRouter(prefix="/senior-personas", tags=["senior-personas"])


@router.get("/", response_model=List[schemas.SeniorPersonaResponse])
def get_senior_personas(
    limit: int = 3,
    department: Optional[str] = None,
    employment_field: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.SeniorPersona)

    if department:
        query = query.filter(models.SeniorPersona.department == department)
    if employment_field:
        query = query.filter(models.SeniorPersona.employment_field == employment_field)

    return (
        query
        .order_by(models.SeniorPersona.similarity_score.desc())
        .limit(limit)
        .all()
    )
