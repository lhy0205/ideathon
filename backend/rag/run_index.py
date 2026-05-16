import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("ncs_data.py 로딩 중...")
from ncs_data import NCS_ITEMS
print(f"총 {len(NCS_ITEMS)}개 항목 로드 완료\n")

import chromadb
from chromadb.utils import embedding_functions

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
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
print("컬렉션 생성 완료\n")

BATCH = 5000
total = len(NCS_ITEMS)
start_time = time.time()

for start in range(0, total, BATCH):
    batch = NCS_ITEMS[start:start + BATCH]
    docs  = [it["unit_name"] + ": " + it["unit_desc"] for it in batch]
    ids   = ["ncs_" + str(start + i) for i in range(len(batch))]
    metas = [{"ncs_code": it["ncs_code"], "unit_name": it["unit_name"], "large_cat": it["large_cat"]} for it in batch]

    batch_num = start // BATCH + 1
    total_batches = (total + BATCH - 1) // BATCH
    print(f"[{batch_num}/{total_batches}] {start+1}~{min(start+BATCH, total)}번 인덱싱 중...")
    col.add(documents=docs, ids=ids, metadatas=metas)
    elapsed = time.time() - start_time
    print(f"  완료 ({elapsed:.0f}초 경과)")

print(f"\n인덱싱 완료! 총 {total}개, 소요시간: {time.time()-start_time:.0f}초")
