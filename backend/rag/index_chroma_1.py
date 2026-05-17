import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ncs_data import NCS_ITEMS

import chromadb
from chromadb.utils import embedding_functions

db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path)
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)
try:
    client.delete_collection("ncs_units_test")
except Exception:
    pass

col = client.create_collection("ncs_units_test", embedding_function=ef)
it = NCS_ITEMS[0]
col.add(documents=[it["unit_name"] + ": " + it["unit_desc"]], ids=["ncs_0"],
        metadatas=[{"ncs_code": it["ncs_code"], "unit_name": it["unit_name"], "large_cat": it["large_cat"]}])
print("1개 인덱싱 완료:", it["unit_name"])
