"""100개만 빠르게 인덱싱 테스트"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ncs_data import NCS_ITEMS

items = NCS_ITEMS[:100]

import chromadb
from chromadb.utils import embedding_functions

db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path)
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)
try:
    client.delete_collection("ncs_units")
    print("기존 컬렉션 삭제")
except Exception:
    pass

col = client.create_collection("ncs_units", embedding_function=ef)
docs  = [it["unit_name"] + ": " + it["unit_desc"] for it in items]
ids   = ["ncs_" + str(i) for i in range(len(items))]
metas = [{"ncs_code": it["ncs_code"], "unit_name": it["unit_name"], "large_cat": it["large_cat"]} for it in items]
col.add(documents=docs, ids=ids, metadatas=metas)
print(f"완료: {len(items)}개 인덱싱됨")

# 쿼리 테스트
results = col.query(query_texts=["프로젝트 관리"], n_results=3)
print("쿼리 테스트 결과:")
for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
    print(f"  - {meta['unit_name']} ({meta['large_cat']})")
