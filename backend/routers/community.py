from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user
import models, schemas, os, aiofiles, uuid

router = APIRouter(prefix="/community", tags=["community"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

@router.get("/posts", response_model=List[schemas.PostResponse])
def get_posts(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    posts = db.query(models.CommunityPost).order_by(
        models.CommunityPost.created_at.desc()
    ).offset(skip).limit(limit).all()
    result = []
    for post in posts:
        user = db.query(models.User).filter(models.User.id == post.user_id).first()
        result.append(schemas.PostResponse(
            id=post.id, user_id=post.user_id, content=post.content,
            image_url=post.image_url, likes=post.likes,
            created_at=post.created_at,
            user_name=user.name if user else None,
            user_image=user.profile_image if user else None,
        ))
    return result

@router.post("/posts", response_model=schemas.PostResponse)
def create_post(body: schemas.PostCreate,
                db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    post = models.CommunityPost(content=body.content, user_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return schemas.PostResponse(
        id=post.id, user_id=post.user_id, content=post.content,
        image_url=post.image_url, likes=post.likes,
        created_at=post.created_at,
        user_name=current_user.name,
        user_image=current_user.profile_image,
    )

@router.put("/posts/{post_id}", response_model=schemas.PostResponse)
def update_post(post_id: int, body: schemas.PostCreate,
                db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    post = db.query(models.CommunityPost).filter(
        models.CommunityPost.id == post_id,
        models.CommunityPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    post.content = body.content
    db.commit()
    db.refresh(post)
    return schemas.PostResponse(
        id=post.id, user_id=post.user_id, content=post.content,
        image_url=post.image_url, likes=post.likes,
        created_at=post.created_at,
        user_name=current_user.name,
        user_image=current_user.profile_image,
    )

@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    post = db.query(models.CommunityPost).filter(
        models.CommunityPost.id == post_id,
        models.CommunityPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    db.delete(post)
    db.commit()
    return {"message": "삭제되었습니다"}

@router.post("/posts/{post_id}/like")
def toggle_like(post_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    existing = db.query(models.PostLike).filter(
        models.PostLike.post_id == post_id,
        models.PostLike.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        post.likes = max(0, post.likes - 1)
        liked = False
    else:
        db.add(models.PostLike(post_id=post_id, user_id=current_user.id))
        post.likes += 1
        liked = True
    db.commit()
    return {"liked": liked, "likes": post.likes}

@router.post("/posts/{post_id}/image", response_model=schemas.PostResponse)
async def upload_post_image(post_id: int, file: UploadFile = File(...),
                             db: Session = Depends(get_db),
                             current_user: models.User = Depends(get_current_user)):
    post = db.query(models.CommunityPost).filter(
        models.CommunityPost.id == post_id,
        models.CommunityPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    post.image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(post)
    return schemas.PostResponse(
        id=post.id, user_id=post.user_id, content=post.content,
        image_url=post.image_url, likes=post.likes,
        created_at=post.created_at,
        user_name=current_user.name,
        user_image=current_user.profile_image,
    )
