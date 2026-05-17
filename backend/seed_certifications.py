"""민간 자격증 초기 데이터 삽입 스크립트 - 한 번만 실행"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

CERTS = [
    # 데이터/IT
    dict(cert_name='ADsP',      category='데이터/AI',  pass_rate=45.0, exam_cost=50000,  related_job='데이터분석가,기획자'),
    dict(cert_name='ADP',       category='데이터/AI',  pass_rate=15.0, exam_cost=70000,  related_job='데이터분석가,데이터사이언티스트'),
    dict(cert_name='SQLD',      category='데이터/IT',  pass_rate=40.0, exam_cost=50000,  related_job='백엔드개발자,DBA,데이터분석가'),
    dict(cert_name='SQLP',      category='데이터/IT',  pass_rate=20.0, exam_cost=70000,  related_job='DBA,데이터아키텍트'),
    dict(cert_name='빅데이터분석기사', category='데이터/AI', pass_rate=35.0, exam_cost=55000, related_job='데이터사이언티스트,AI엔지니어'),

    # 경영/회계/사무
    dict(cert_name='ERP정보관리사 1급', category='경영/회계', pass_rate=50.0, exam_cost=50000, related_job='회계,물류,생산관리'),
    dict(cert_name='ERP정보관리사 2급', category='경영/회계', pass_rate=60.0, exam_cost=40000, related_job='회계,물류,생산관리'),
    dict(cert_name='컴퓨터활용능력 1급', category='사무/IT',  pass_rate=28.0, exam_cost=25000, related_job='사무직 전반'),
    dict(cert_name='컴퓨터활용능력 2급', category='사무/IT',  pass_rate=45.0, exam_cost=20000, related_job='사무직 전반'),
    dict(cert_name='전산회계 1급',  category='경영/회계', pass_rate=40.0, exam_cost=30000, related_job='회계,경리'),
    dict(cert_name='전산회계 2급',  category='경영/회계', pass_rate=55.0, exam_cost=25000, related_job='회계,경리'),
    dict(cert_name='전산세무 1급',  category='경영/회계', pass_rate=20.0, exam_cost=35000, related_job='세무,회계'),
    dict(cert_name='전산세무 2급',  category='경영/회계', pass_rate=35.0, exam_cost=30000, related_job='세무,회계'),
    dict(cert_name='FAT 1급',    category='경영/회계', pass_rate=50.0, exam_cost=25000, related_job='회계실무'),
    dict(cert_name='TAT 1급',    category='경영/회계', pass_rate=30.0, exam_cost=35000, related_job='세무실무'),

    # 어학
    dict(cert_name='TOEIC',          category='어학', pass_rate=None, exam_cost=52000, related_job='취업 전반 (점수 활용)'),
    dict(cert_name='OPIc',           category='어학', pass_rate=None, exam_cost=84000, related_job='취업 전반 (말하기)'),
    dict(cert_name='TOEIC Speaking', category='어학', pass_rate=None, exam_cost=77000, related_job='취업 전반 (말하기)'),
    dict(cert_name='JPT',            category='어학', pass_rate=None, exam_cost=44000, related_job='일본어 관련 직무'),
    dict(cert_name='HSK 5급',        category='어학', pass_rate=None, exam_cost=66000, related_job='중국어 관련 직무'),

    # 클라우드
    dict(cert_name='AWS Cloud Practitioner',       category='클라우드', pass_rate=75.0, exam_cost=130000, related_job='클라우드엔지니어,DevOps'),
    dict(cert_name='AWS Solutions Architect',      category='클라우드', pass_rate=65.0, exam_cost=175000, related_job='클라우드아키텍트,백엔드'),
    dict(cert_name='Azure Fundamentals',           category='클라우드', pass_rate=80.0, exam_cost=130000, related_job='클라우드엔지니어'),

    # 유통/물류
    dict(cert_name='유통관리사 2급', category='유통/물류', pass_rate=40.0, exam_cost=25000, related_job='유통,물류,MD'),
    dict(cert_name='물류관리사',     category='유통/물류', pass_rate=30.0, exam_cost=30000, related_job='물류관리,SCM'),
    dict(cert_name='사회조사분석사 2급', category='마케팅', pass_rate=35.0, exam_cost=25000, related_job='마케팅,리서치,기획'),
]

def seed():
    db = SessionLocal()
    inserted = 0
    skipped = 0
    for c in CERTS:
        exists = db.query(models.Certification).filter(
            models.Certification.cert_name == c['cert_name']
        ).first()
        if exists:
            skipped += 1
            continue
        db.add(models.Certification(**c))
        inserted += 1
    db.commit()
    db.close()
    print(f"✅ 완료: {inserted}개 삽입, {skipped}개 중복 스킵")

if __name__ == '__main__':
    seed()
