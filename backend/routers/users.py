from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models, schemas, os, aiofiles, uuid

router = APIRouter(prefix="/users", tags=["users"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_my_profile(body: schemas.UserUpdate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/profile-image", response_model=schemas.UserResponse)
async def upload_profile_image(file: UploadFile = File(...),
                                db: Session = Depends(get_db),
                                current_user: models.User = Depends(get_current_user)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    current_user.profile_image = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user
