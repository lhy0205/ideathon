"""ncs_data.py -> ChromaDB 인덱싱"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
from ncs_data import NCS_ITEMS

def index_to_chroma(items):
    import chromadb
    from chromadb.utils import embedding_functions
    db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
    client = chromadb.PersistentClient(path=db_path)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="paraphrase-multilingual-MiniLM-L12-v2"
    )
    try:
        client.delete_collection("ncs_units")
        print("기존 컬렉션 삭제됨")
    except Exception:
        pass
    col = client.create_collection("ncs_units", embedding_function=ef)
    BATCH = 5000
    for start in range(0, len(items), BATCH):
        batch = items[start:start + BATCH]
        docs  = [it["unit_name"] + ": " + it["unit_desc"] for it in batch]
        ids   = ["ncs_" + str(start + i) for i in range(len(batch))]
        metas = [{"ncs_code": it["ncs_code"], "unit_name": it["unit_name"], "large_cat": it["large_cat"]} for it in batch]
        col.add(documents=docs, ids=ids, metadatas=metas)
        print(f"  {min(start + BATCH, len(items))}/{len(items)} 완료")
    print(f"ChromaDB 인덱싱 완료: {len(items)}개")

if __name__ == "__main__":
    print(f"총 {len(NCS_ITEMS)}개 항목 인덱싱 시작...")
    index_to_chroma(NCS_ITEMS)
