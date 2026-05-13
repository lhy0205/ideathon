"""경험 텍스트로 관련 NCS 역량 검색."""
from rag.chroma_store import get_collection

def retrieve_ncs(query: str, n_results: int = 5) -> list[dict]:
    """query와 가장 유사한 NCS 단위 n개를 반환한다."""
    collection = get_collection()
    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=min(n_results, collection.count()))

    items = []
    for i, meta in enumerate(results["metadatas"][0]):
        items.append({
            "ncs_code":  meta.get("ncs_code", ""),
            "unit_name": meta.get("unit_name", ""),
            "large_cat": meta.get("large_cat", ""),
            "document":  results["documents"][0][i],
            "distance":  results["distances"][0][i] if "distances" in results else 0,
        })
    return items
