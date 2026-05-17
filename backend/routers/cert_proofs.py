from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from dependencies import get_current_user
import models, schemas
from cloudinary_utils import upload_file, delete_file

router = APIRouter(prefix="/cert-proofs", tags=["cert-proofs"])


@router.get("/", response_model=List[schemas.CertProofResponse])
def get_my_cert_proofs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.CertProof).filter(
        models.CertProof.user_id == current_user.id
    ).order_by(models.CertProof.created_at.desc()).all()


@router.post("/", response_model=schemas.CertProofResponse)
async def create_cert_proof(
    cert_name: str = Form(...),
    status: str = Form("준비 중"),
    cert_id: Optional[int] = Form(None),
    exam_date: Optional[str] = Form(None),
    passed_date: Optional[str] = Form(None),
    score: Optional[float] = Form(None),
    study_hours: Optional[int] = Form(None),
    target_hours: Optional[int] = Form(None),
    target_exam_date: Optional[str] = Form(None),
    proof_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    image_url = None
    if proof_image and proof_image.filename:
        image_url = upload_file(await proof_image.read(), folder="cert_proofs")

    proof = models.CertProof(
        user_id=current_user.id,
        cert_id=cert_id,
        cert_name=cert_name,
        status=status,
        exam_date=exam_date,
        passed_date=passed_date,
        score=score,
        study_hours=study_hours,
        target_hours=target_hours,
        target_exam_date=target_exam_date,
        proof_image=image_url,
    )
    db.add(proof)
    db.commit()
    db.refresh(proof)
    return proof


@router.patch("/{proof_id}", response_model=schemas.CertProofResponse)
async def update_cert_proof(
    proof_id: int,
    cert_name: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    passed_date: Optional[str] = Form(None),
    target_exam_date: Optional[str] = Form(None),
    proof_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    proof = db.query(models.CertProof).filter(
        models.CertProof.id == proof_id,
        models.CertProof.user_id == current_user.id,
    ).first()
    if not proof:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다")

    if cert_name is not None: proof.cert_name = cert_name
    if status is not None: proof.status = status
    if passed_date is not None: proof.passed_date = passed_date
    if target_exam_date is not None: proof.target_exam_date = target_exam_date

    if proof_image and proof_image.filename:
        delete_file(proof.proof_image)
        proof.proof_image = upload_file(await proof_image.read(), folder="cert_proofs")

    db.commit()
    db.refresh(proof)
    return proof


@router.delete("/{proof_id}")
def delete_cert_proof(
    proof_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    proof = db.query(models.CertProof).filter(
        models.CertProof.id == proof_id,
        models.CertProof.user_id == current_user.id,
    ).first()
    if not proof:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다")

    delete_file(proof.proof_image)
    db.delete(proof)
    db.commit()
    return {"message": "삭제 완료"}
