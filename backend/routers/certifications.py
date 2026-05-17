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


@router.get("/schedule", response_model=List[CertItem])
async def get_cert_schedule(
    category: Optional[str] = None,
):
    """국가기술자격 종목 목록 조회"""
    if not QNET_API_KEY:
        raise HTTPException(status_code=500, detail="QNET_API_KEY가 설정되지 않았습니다")

    params = {
        "serviceKey": QNET_API_KEY,
        "numOfRows": 100,
        "pageNo": 1,
    }
    if category:
        params["seriesCd"] = category

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            list_res = await client.get(QNET_LIST_URL, params=params)
            list_res.raise_for_status()
    except Exception:
        return []

    try:
        root = ET.fromstring(list_res.text)
    except ET.ParseError:
        return []

    result_code = root.findtext(".//resultCode")
    if result_code and result_code != "00":
        return []

    items = root.findall(".//item")
    result = []
    for item in items:
        code = (item.findtext("jmCd") or item.findtext("jmcd") or "").strip()
        result.append(CertItem(
            cert_code=code or None,
            cert_name=item.findtext("jmFldNm") or item.findtext("jmfldnm") or "",
            category=item.findtext("seriesNm") or item.findtext("seriesnm"),
            related_job=item.findtext("obligFldNm") or item.findtext("obligfldnm"),
        ))
    return result
