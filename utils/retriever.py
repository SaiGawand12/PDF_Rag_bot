import faiss
import pickle
import os
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

index = None
chunks = None

def reset_cache():
    """Call this after a new PDF is indexed so retriever reloads fresh data."""
    global index, chunks
    index = None
    chunks = None

def load_vectorstore():
    global index, chunks
    index = faiss.read_index("vectorstore/faiss.index")
    with open("vectorstore/chunks.pkl", "rb") as f:
        chunks = pickle.load(f)

def retrieve(query, k=5):
    if not os.path.exists("vectorstore/faiss.index"):
        return []

    load_vectorstore()

    query_embedding = model.encode(
        [query],
        normalize_embeddings=True
    ).astype("float32")

    scores, indices = index.search(query_embedding, 15)

    results = []
    seen_pages = set()

    for idx in indices[0]:
        if idx == -1:
            continue

        page = chunks[idx]["page"]

        if page not in seen_pages:
            results.append(chunks[idx])
            seen_pages.add(page)

        if len(results) >= k:
            break

    return results