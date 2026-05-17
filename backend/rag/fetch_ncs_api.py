"""
공공데이터포털 한국산업인력공단_NCS 기준정보 조회 API
NCS001(대분류) → NCS002(중분류) → NCS003(소분류) → NCS004(세분류) → NCS005(능력단위)
계층적으로 수집하여 ncs_data.py 형태로 저장 + ChromaDB 인덱싱
"""
import urllib.request, ssl, json, time, os, sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_KEY = os.getenv("NCS_API_KEY", "387e8b8d7cbbfb425df7387f8a2ba43be6e2a14c14d9456bf9e6f340235f12f5")
BASE = "https://apis.data.go.kr/B490007/hrdkapi"

def call_api(op, params, retry=3):
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{BASE}{op}?serviceKey={API_KEY}&{qs}"
    for attempt in range(retry):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                raw = r.read()
                # UTF-8 먼저 시도, 실패하면 EUC-KR
                try:
                    text = raw.decode("utf-8")
                except UnicodeDecodeError:
                    text = raw.decode("euc-kr", errors="replace")
                data = json.loads(text)
                header = data["response"]["header"]
                if header["resultCode"] == "00":
                    body = data["response"]["body"]
                    items = body.get("items", {})
                    if not items:
                        return []
                    item = items.get("item", [])
                    return item if isinstance(item, list) else [item]
                else:
                    print(f"  API 오류 {op}: {header['resultMsg']}")
                    return []
        except Exception as e:
            print(f"  재시도 {attempt+1}/{retry} {op}: {e}")
            time.sleep(1)
    return []

def dedup_by_max_degr(items, key):
    """같은 key를 가진 항목 중 NCS_DEGR가 가장 높은 것만 남긴다."""
    seen = {}
    for x in items:
        k = x.get(key, "")
        if k not in seen or x.get("NCS_DEGR", 0) > seen[k].get("NCS_DEGR", 0):
            seen[k] = x
    return list(seen.values())

def fetch_all():
    ncs_items = []
    seen_units = set()  # 능력단위 중복 방지

    print("▶ NCS001 대분류 조회...")
    large_list = call_api("/NCS001", {"pageNo": "1", "numOfRows": "200"})
    uniq_large = dedup_by_max_degr(large_list, "NCS_LCLAS_CD")
    print(f"  대분류 {len(uniq_large)}개 (전체 {len(large_list)}개)")

    for lc in uniq_large:
        lc_cd = lc["NCS_LCLAS_CD"]
        lc_nm = lc["NCS_LCLAS_CDNM"]

        print(f"  ▶ NCS002 중분류 ({lc_nm})...")
        mid_list = call_api("/NCS002", {"pageNo": "1", "numOfRows": "200", "NCS_LCLAS_CD": lc_cd})
        uniq_mid = dedup_by_max_degr(mid_list, "NCS_MCLAS_CD")
        time.sleep(0.3)

        for mc in uniq_mid:
            mc_cd = mc["NCS_MCLAS_CD"]
            mc_nm = mc["NCS_MCLAS_CDNM"]

            sm_list = call_api("/NCS003", {"pageNo": "1", "numOfRows": "200",
                                           "NCS_LCLAS_CD": lc_cd, "NCS_MCLAS_CD": mc_cd})
            uniq_sm = dedup_by_max_degr(sm_list, "NCS_SCLAS_CD")
            time.sleep(0.3)

            for sc in uniq_sm:
                sc_cd = sc["NCS_SCLAS_CD"]
                sc_nm = sc["NCS_SCLAS_CDNM"]

                dtl_list = call_api("/NCS004", {"pageNo": "1", "numOfRows": "200",
                                                "NCS_LCLAS_CD": lc_cd, "NCS_MCLAS_CD": mc_cd,
                                                "NCS_SCLAS_CD": sc_cd})
                uniq_dtl = dedup_by_max_degr(dtl_list, "NCS_SUBD_CD")
                time.sleep(0.3)

                for dc in uniq_dtl:
                    dc_cd = dc.get("NCS_SUBD_CD", "")
                    if not dc_cd:
                        continue

                    unit_list = call_api("/NCS005", {"pageNo": "1", "numOfRows": "200",
                                                     "NCS_LCLAS_CD": lc_cd, "NCS_MCLAS_CD": mc_cd,
                                                     "NCS_SCLAS_CD": sc_cd,
                                                     "NCS_SUBD_CD": dc_cd})
                    time.sleep(0.3)

                    uniq_units = dedup_by_max_degr(unit_list, "NCS_COMPE_UNIT_CD")
                    for u in uniq_units:
                        ncs_code = u.get("NCS_CL_CD") or u.get("NCS_COMPE_UNIT_CD", "")
                        unit_name = u.get("COMPE_UNIT_NAME", "")
                        unit_desc = u.get("COMPE_UNIT_DEF", "") or f"{lc_nm} 분야 {unit_name} 역량"

                        if ncs_code and unit_name and ncs_code not in seen_units:
                            seen_units.add(ncs_code)
                            ncs_items.append({
                                "ncs_code": ncs_code,
                                "large_cat": lc_nm,
                                "middle_cat": mc_nm,
                                "small_cat": sc_nm,
                                "unit_name": unit_name,
                                "unit_desc": unit_desc,
                            })

    return ncs_items

def save_to_file(items):
    import json as _json
    # JSON으로 저장 (더 안전하고 개행 문제 없음)
    json_path = os.path.join(os.path.dirname(__file__), "ncs_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        _json.dump(items, f, ensure_ascii=False, indent=2)
    # Python 모듈로도 저장
    lines = ["NCS_ITEMS = [\n"]
    for it in items:
        lines.append("    {\n")
        for k, v in it.items():
            escaped = str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", "")
            lines.append(f'        "{k}": "{escaped}",\n')
        lines.append("    },\n")
    lines.append("]\n")
    path = os.path.join(os.path.dirname(__file__), "ncs_data.py")
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"ncs_data.py 저장 완료: {len(items)}개 항목")

def index_to_chroma(items):
    try:
        import chromadb
        from chromadb.utils import embedding_functions
        db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
        client = chromadb.PersistentClient(path=db_path)
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
        try:
            client.delete_collection("ncs_units")
        except Exception:
            pass
        col = client.create_collection("ncs_units", embedding_function=ef)
        docs, ids, metas = [], [], []
        for i, it in enumerate(items):
            docs.append(f"{it['unit_name']}: {it['unit_desc']}")
            ids.append(f"ncs_{i}")
            metas.append({
                "ncs_code": it["ncs_code"],
                "unit_name": it["unit_name"],
                "large_cat": it["large_cat"],
            })
        col.add(documents=docs, ids=ids, metadatas=metas)
        print(f"✅ ChromaDB 인덱싱 완료: {len(items)}개")
    except Exception as e:
        print(f"⚠️ ChromaDB 인덱싱 실패: {e}")

if __name__ == "__main__":
    print("=== NCS API 데이터 수집 시작 ===\n")
    items = fetch_all()
    print(f"\n총 {len(items)}개 능력단위 수집")
    if items:
        print("샘플:", items[0])
        save_to_file(items)
        print("\nChromaDB 인덱싱 중...")
        index_to_chroma(items)
    else:
        print("❌ 데이터 없음 - API 응답 확인 필요")
