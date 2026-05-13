"""ChromaDB 컬렉션 초기화 및 NCS 데이터 인덱싱."""
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import os, sys

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "ncs_units"

_embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

def get_collection():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_embedding_fn,
    )
    return collection

def index_ncs_from_db():
    """ncs_info 테이블 데이터를 ChromaDB에 인덱싱한다."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from database import SessionLocal
    from models import NCSInfo

    collection = get_collection()

    if collection.count() > 0:
        print(f"ChromaDB에 이미 {collection.count()}개 문서가 있습니다. 건너뜁니다.")
        return

    db = SessionLocal()
    try:
        items = db.query(NCSInfo).all()
        if not items:
            print("ncs_info 테이블이 비어 있습니다. seed_db.py를 먼저 실행하세요.")
            return

        ids = [str(item.idx) for item in items]
        documents = [
            f"{item.unit_name}: {item.unit_desc}"
            for item in items
        ]
        metadatas = [
            {
                "ncs_code":   item.ncs_code,
                "unit_name":  item.unit_name,
                "large_cat":  item.large_cat or "",
                "middle_cat": item.middle_cat or "",
                "small_cat":  item.small_cat or "",
            }
            for item in items
        ]

        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        print(f"ChromaDB에 NCS {len(items)}개 인덱싱 완료")
    finally:
        db.close()

if __name__ == "__main__":
    index_ncs_from_db()
