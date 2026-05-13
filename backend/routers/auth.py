from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import get_db
from dependencies import create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import models, schemas, httpx, os, secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── 회원가입 ──
@router.post("/register", response_model=schemas.TokenResponse)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="이미 사용중인 이메일입니다")
    user = models.User(
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        name=body.name,
        job_interest=body.job_interest,
        gap_start_date=body.gap_start_date,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

# ── 로그인 ──
@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not user.password_hash or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다")
    return schemas.TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

# ── 토큰 갱신 ──
@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
        user_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")
    return schemas.TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )

# ── 카카오 OAuth ──
@router.get("/kakao")
def kakao_login():
    client_id = os.getenv("KAKAO_CLIENT_ID")
    redirect_uri = os.getenv("KAKAO_REDIRECT_URI")
    return {"url": f"https://kauth.kakao.com/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code"}

@router.get("/kakao/callback", response_model=schemas.TokenResponse)
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://kauth.kakao.com/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": os.getenv("KAKAO_CLIENT_ID"),
            "redirect_uri": os.getenv("KAKAO_REDIRECT_URI"),
            "code": code,
        })
        kakao_token = token_res.json().get("access_token")
        user_res = await client.get("https://kapi.kakao.com/v2/user/me",
                                    headers={"Authorization": f"Bearer {kakao_token}"})
        info = user_res.json()
    oauth_id = str(info["id"])
    email = info.get("kakao_account", {}).get("email", f"{oauth_id}@kakao.com")
    name  = info.get("kakao_account", {}).get("profile", {}).get("nickname", "카카오유저")
    return _get_or_create_oauth_user(db, email, name, "kakao", oauth_id)

# ── 네이버 OAuth ──
@router.get("/naver")
def naver_login():
    client_id = os.getenv("NAVER_CLIENT_ID")
    redirect_uri = os.getenv("NAVER_REDIRECT_URI")
    return {"url": f"https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&state=naver"}

@router.get("/naver/callback", response_model=schemas.TokenResponse)
async def naver_callback(code: str, state: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://nid.naver.com/oauth2.0/token", params={
            "grant_type": "authorization_code",
            "client_id": os.getenv("NAVER_CLIENT_ID"),
            "client_secret": os.getenv("NAVER_CLIENT_SECRET"),
            "redirect_uri": os.getenv("NAVER_REDIRECT_URI"),
            "code": code, "state": state,
        })
        naver_token = token_res.json().get("access_token")
        user_res = await client.get("https://openapi.naver.com/v1/nid/me",
                                    headers={"Authorization": f"Bearer {naver_token}"})
        info = user_res.json().get("response", {})
    return _get_or_create_oauth_user(db, info.get("email", f"{info['id']}@naver.com"),
                                     info.get("name", "네이버유저"), "naver", info["id"])

# ── 구글 OAuth ──
@router.get("/google")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    return {"url": (f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}"
                    f"&redirect_uri={redirect_uri}&response_type=code"
                    f"&scope=openid%20email%20profile")}

@router.get("/google/callback", response_model=schemas.TokenResponse)
async def google_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code, "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
            "grant_type": "authorization_code",
        })
        google_token = token_res.json().get("access_token")
        user_res = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                                    headers={"Authorization": f"Bearer {google_token}"})
        info = user_res.json()
    return _get_or_create_oauth_user(db, info["email"], info.get("name", "구글유저"), "google", info["id"])

def _get_or_create_oauth_user(db, email, name, provider, oauth_id):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(email=email, name=name,
                           oauth_provider=provider, oauth_id=oauth_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return schemas.TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

# ── 비밀번호 재설정 요청 ──
@router.post("/password-reset/request")
def request_password_reset(body: schemas.PasswordResetRequest,
                            background_tasks: BackgroundTasks,
                            db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        return {"message": "이메일이 존재하면 재설정 링크를 발송합니다"}
    token = secrets.token_urlsafe(32)
    reset = models.PasswordResetToken(
        user_id=user.id, token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(reset)
    db.commit()
    from routers.email import send_reset_email
    background_tasks.add_task(send_reset_email, user.email, token)
    return {"message": "재설정 링크를 이메일로 발송했습니다"}

# ── 비밀번호 재설정 확인 ──
@router.post("/password-reset/confirm")
def confirm_password_reset(body: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == body.token,
        models.PasswordResetToken.used == False,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 링크입니다")
    user = db.query(models.User).filter(models.User.id == reset.user_id).first()
    user.password_hash = pwd_context.hash(body.new_password)
    reset.used = True
    db.commit()
    return {"message": "비밀번호가 변경되었습니다"}
