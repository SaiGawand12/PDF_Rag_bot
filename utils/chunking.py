import re

_SPLIT = re.compile(r'(?<=[.!?])\s+')

def chunk_documents(documents, chunk_size=2000, overlap=100):
    """
    Larger chunks = fewer embeddings = faster indexing.
    For retrieval quality, 2000 chars per chunk is still fine for Flan-T5's 512 token limit.
    """
    chunks = []

    for doc in documents:
        text = doc["content"].strip()
        page = doc["page"]

        # If the whole page fits in one chunk, just use it directly — fastest path
        if len(text) <= chunk_size:
            chunks.append({"content": text, "page": page})
            continue

        # Otherwise split by sentences
        sentences = _SPLIT.split(text)
        current = ""

        for sent in sentences:
            if len(current) + len(sent) < chunk_size:
                current += " " + sent
            else:
                if current.strip():
                    chunks.append({"content": current.strip(), "page": page})
                current = current[-overlap:] + " " + sent

        if current.strip():
            chunks.append({"content": current.strip(), "page": page})

    return chunks
