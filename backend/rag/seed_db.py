"""ncs_info 테이블에 샘플 NCS 데이터를 삽입하는 스크립트. 한 번만 실행."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
from models import NCSInfo
from rag.ncs_data import NCS_ITEMS

def seed():
    db = SessionLocal()
    try:
        existing = db.query(NCSInfo).count()
        if existing > 0:
            print(f"이미 {existing}개 NCS 데이터가 있습니다. 건너뜁니다.")
            return

        for item in NCS_ITEMS:
            db.add(NCSInfo(**item))
        db.commit()
        print(f"NCS 데이터 {len(NCS_ITEMS)}개 삽입 완료")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
