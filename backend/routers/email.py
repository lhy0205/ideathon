import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM     = os.getenv("MAIL_FROM")
MAIL_SERVER   = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT     = int(os.getenv("MAIL_PORT", 587))
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

def send_reset_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[Pause to Pass] 비밀번호 재설정 안내"
    msg["From"]    = MAIL_FROM
    msg["To"]      = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#FDF3EE;border-radius:12px;">
      <h2 style="color:#C75B3A;">Pause to Pass</h2>
      <p>아래 버튼을 클릭해 비밀번호를 재설정하세요. 링크는 <b>1시간</b> 동안 유효합니다.</p>
      <a href="{reset_link}"
         style="display:inline-block;padding:12px 28px;background:#C75B3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
        비밀번호 재설정
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px;">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())

def send_welcome_email(to_email: str, name: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[Pause to Pass] 가입을 환영합니다!"
    msg["From"]    = MAIL_FROM
    msg["To"]      = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#FDF3EE;border-radius:12px;">
      <h2 style="color:#C75B3A;">Pause to Pass</h2>
      <p><b>{name}</b>님, 가입을 환영합니다! 🎉</p>
      <p>공백기를 합격의 자산으로 만들어드릴게요.</p>
      <a href="{FRONTEND_URL}/dashboard"
         style="display:inline-block;padding:12px 28px;background:#C75B3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
        시작하기
      </a>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())
