import httpx
import os
import xml.etree.ElementTree as ET
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/certifications", tags=["certifications"])

QNET_API_KEY = os.getenv("QNET_API_KEY", "")
QNET_LIST_URL = "https://openapi.q-net.or.kr/api/service/rest/InquiryListNationalQualifcationSVC/getList"


class CertItem(BaseModel):
    cert_code: Optional[str] = None
    cert_name: str
    category: Optional[str] = None
    related_job: Optional[str] = None
    apply_start: Optional[str] = None
    apply_end: Optional[str] = None
    exam_start: Optional[str] = None
    exam_end: Optional[str] = None
    result_date: Optional[str] = None


@router.get("/schedule", response_model=List[CertItem])
async def get_cert_schedule(
    category: Optional[str] = None,
):
    """국가기술자격 종목 목록 조회 (Q-Net API)"""
    if not QNET_API_KEY:
        raise HTTPException(status_code=500, detail="QNET_API_KEY가 설정되지 않았습니다")

    params = {
        "serviceKey": QNET_API_KEY,
        "numOfRows": 100,
        "pageNo": 1,
    }
    if category:
        params["seriesCd"] = category

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(QNET_LIST_URL, params=params)
        res.raise_for_status()

    try:
        root = ET.fromstring(res.text)
    except ET.ParseError:
        raise HTTPException(status_code=502, detail="Q-Net API 응답 파싱 실패")

    result_code = root.findtext(".//resultCode")
    if result_code and result_code != "00":
        raise HTTPException(status_code=502, detail=f"Q-Net API 오류: {root.findtext('.//resultMsg')}")

    items = root.findall(".//item")
    return [
        CertItem(
            cert_code=item.findtext("jmcd"),
            cert_name=item.findtext("jmfldnm") or "",
            category=item.findtext("seriesnm"),
            related_job=item.findtext("obligfldnm"),
        )
        for item in items
    ]
