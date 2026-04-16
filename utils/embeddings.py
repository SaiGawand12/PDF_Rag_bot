from sentence_transformers import SentenceTransformer
import faiss
import pickle
import os
import hashlib
import json

os.environ["HF_HUB_OFFLINE"] = "1"

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

FAISS_PATH  = "vectorstore/faiss.index"
CHUNKS_PATH = "vectorstore/chunks.pkl"
HASH_PATH   = "vectorstore/hashes.json"


def _load_hashes() -> set:
    if os.path.exists(HASH_PATH):
        with open(HASH_PATH) as f:
            return set(json.load(f))
    return set()


def _save_hashes(hashes: set):
    with open(HASH_PATH, "w") as f:
        json.dump(list(hashes), f)


def _chunk_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def _rebuild_index(chunks):
    """Rebuild FAISS index from scratch for a given list of chunks."""
    if not chunks:
        # wipe everything
        for p in [FAISS_PATH, CHUNKS_PATH, HASH_PATH]:
            if os.path.exists(p):
                os.remove(p)
        return

    texts = [c["content"] for c in chunks]
    embeddings = model.encode(
        texts,
        batch_size=128,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).astype("float32")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    faiss.write_index(index, FAISS_PATH)

    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)

    hashes = {_chunk_hash(c["content"]) for c in chunks}
    _save_hashes(hashes)


def create_vector_store(new_chunks, filename: str = ""):
    os.makedirs("vectorstore", exist_ok=True)

    known_hashes = _load_hashes()

    # Tag each chunk with its source filename
    for c in new_chunks:
        c["source"] = filename

    fresh = [c for c in new_chunks if _chunk_hash(c["content"]) not in known_hashes]

    if not fresh:
        return

    texts = [c["content"] for c in fresh]
    embeddings = model.encode(
        texts,
        batch_size=128,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).astype("float32")

    if os.path.exists(FAISS_PATH) and os.path.exists(CHUNKS_PATH):
        index = faiss.read_index(FAISS_PATH)
        with open(CHUNKS_PATH, "rb") as f:
            existing_chunks = pickle.load(f)
        index.add(embeddings)
        all_chunks = existing_chunks + fresh
    else:
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        all_chunks = fresh

    faiss.write_index(index, FAISS_PATH)
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(all_chunks, f)

    known_hashes.update(_chunk_hash(c["content"]) for c in fresh)
    _save_hashes(known_hashes)


def delete_from_vector_store(filename: str):
    """Remove all chunks belonging to a file and rebuild the index."""
    if not os.path.exists(CHUNKS_PATH):
        return

    with open(CHUNKS_PATH, "rb") as f:
        all_chunks = pickle.load(f)

    remaining = [c for c in all_chunks if c.get("source") != filename]
    _rebuild_index(remaining)
