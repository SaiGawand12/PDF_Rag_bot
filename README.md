# DocMind — Retrieval-Augmented Chatbot for Topic-Based Learning from PDF Documents

A fully local, privacy-preserving RAG (Retrieval-Augmented Generation) system that lets you upload PDF documents and ask natural language questions about their content. Everything runs on your machine — no cloud APIs, no subscriptions, no data leaves your device.

---

## Demo

> Upload a PDF → Ask questions → Get answers with page citations

```
User: What is artificial intelligence?

DocMind: endeavours to simulate the natural intelligence of human beings
         into machines, thus making them behave intelligently [Page 3]
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│              Next.js + TypeScript (port 3000)                   │
│         User ──► UI Chat Interface ──► REST API calls           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                       BACKEND API                               │
│                  Flask app.py (port 5000)                       │
│         /api/upload  /api/status  /api/chat  /api/delete        │
└──────┬───────────────────────────────────────┬──────────────────┘
       │                                       │
       │  DOCUMENT INGESTION FLOW              │  QUERY FLOW
       ▼                                       ▼
┌─────────────┐   ┌──────────┐   ┌─────────┐  ┌──────────────┐
│  PDF Loader │──►│ Chunking │──►│   BGE   │  │  BGE Encode  │
│   (pypdf)   │   │ (regex)  │   │ Encoder │  │    Query     │
└─────────────┘   └──────────┘   └────┬────┘  └──────┬───────┘
                                       │               │
                                       ▼               ▼
                                ┌─────────────────────────┐
                                │      FAISS Index        │
                                │   (vectorstore/)        │
                                └────────────┬────────────┘
                                             │ Top-K Chunks
                                             ▼
                                    ┌─────────────────┐
                                    │   Flan-T5-base  │
                                    │  (generation)   │
                                    └────────┬────────┘
                                             │
                                             ▼
                                   Answer + Page Citations
```

### Two Flows

**Document Ingestion (on upload):**
`PDF` → `pypdf extraction` → `regex chunking` → `BGE embedding` → `FAISS index`

**Query (on question):**
`User query` → `BGE embedding` → `FAISS semantic search` → `Top-K chunks` → `Flan-T5 generation` → `Answer`

---

## Features

- **Chat interface** — ChatGPT-style conversation with your PDF
- **Page citations** — every answer references the source page
- **Multi-document** — upload and query multiple PDFs simultaneously
- **Background processing** — PDF indexing runs async, UI stays responsive
- **Deduplication** — re-uploading the same PDF skips re-embedding
- **Document management** — delete PDFs from the sidebar, vectorstore rebuilds automatically
- **Fully responsive** — works on desktop and mobile (bottom sheet sidebar on mobile)
- **100% local** — no API keys, no internet required after first model download

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, React 19 |
| Backend | Python 3.11, Flask 3.1 |
| Embeddings | BGE-small-en-v1.5 (133MB) |
| Vector Store | FAISS IndexFlatIP |
| Language Model | Flan-T5-base (990MB) |
| PDF Parsing | pypdf |
| Cross-Origin | flask-cors |

---

## Project Structure

```
pdf_rag_chatbot/
│
├── app.py                      # Flask server — all API routes
├── requirements.txt            # Python dependencies
│
├── uploads/                    # Uploaded PDFs stored here
├── vectorstore/
│   ├── faiss.index             # FAISS vector index
│   ├── chunks.pkl              # Chunk metadata with page numbers
│   └── hashes.json             # MD5 deduplication registry
│
├── utils/
│   ├── pdf_loader.py           # PDF text extraction (pypdf)
│   ├── chunking.py             # Regex-based text chunking
│   ├── embeddings.py           # BGE encoding + FAISS management
│   ├── retriever.py            # Semantic retrieval with cache
│   └── llm.py                  # Flan-T5 answer generation
│
├── templates/
│   └── index.html              # Legacy Flask HTML interface
│
└── frontend/                   # Next.js application
    ├── app/
    │   ├── page.tsx            # Main chat page
    │   ├── layout.tsx          # Root layout
    │   └── globals.css         # Global styles
    ├── components/
    │   ├── Sidebar.tsx         # Upload + document management
    │   ├── ChatMessage.tsx     # Message bubble component
    │   ├── ChatInput.tsx       # Input with send button
    │   ├── EmptyState.tsx      # Onboarding / suggestion screen
    │   └── TypingIndicator.tsx # Animated loading dots
    └── types/
        └── index.ts            # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- 8GB RAM minimum
- ~2GB free disk space (for models)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/pdf_rag_chatbot.git
cd pdf_rag_chatbot
```

### 2. Backend setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (one time only)
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Run the application

**Terminal 1 — Backend:**
```bash
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

> **First run:** The system automatically downloads BGE-small-en-v1.5 (~133MB) and Flan-T5-base (~990MB) from Hugging Face on first startup. This requires internet. All subsequent runs work without internet.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a PDF. Returns `job_id` immediately, processes in background |
| `GET` | `/api/status/<job_id>` | Poll indexing status: `processing` / `done` / `error` |
| `POST` | `/api/chat` | Send a question, receive a generated answer |
| `POST` | `/api/delete` | Remove a PDF and rebuild the vectorstore |

### Example

```bash
# Upload a PDF
curl -X POST http://localhost:5000/api/upload \
  -F "pdf=@document.pdf"
# → { "job_id": "abc-123", "filename": "document.pdf" }

# Check status
curl http://localhost:5000/api/status/abc-123
# → { "status": "done", "filename": "document.pdf" }

# Ask a question
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?"}'
# → { "answer": "Machine learning is... [Page 12]" }
```

---

## Evaluation Results

Evaluated on 8 domain-specific questions across Computer Networks and DSML documents.

### Embedding Model Comparison: BGE vs MiniLM

| Model | Avg Semantic Similarity | Avg Retrieval Time |
|---|---|---|
| **BGE-small-en-v1.5** | **0.66** | ~0.03s |
| all-MiniLM-L6-v2 | 0.31 | ~0.02s |

BGE achieves **113% higher semantic similarity** than MiniLM on technical document queries.

### Language Model Comparison: T5-base vs T5-small

| Model | Avg Semantic Similarity | Avg Generation Time |
|---|---|---|
| **Flan-T5-base** | **0.81** | ~1.58s |
| Flan-T5-small | 0.71 | ~0.44s |

### Full System Comparison

| Configuration | Avg Score | Avg Response Time |
|---|---|---|
| **BGE + T5-base** | **0.81** | ~1.40s |
| MiniLM + T5-small | 0.71 | ~0.38s |

The production configuration (BGE + T5-base) delivers **14% higher answer quality** at an acceptable latency cost.

---

## How It Works

### 1. PDF Indexing Pipeline

When you upload a PDF:

1. **pypdf** extracts text page by page with `strict=False` to handle malformed documents
2. Each page is split into overlapping chunks (~2000 chars, 100-char overlap) using regex sentence boundary detection
3. Each chunk is tagged with its source filename and page number
4. New chunks are filtered against an MD5 hash registry to skip previously embedded content
5. Remaining chunks are encoded by **BGE-small-en-v1.5** in batches of 128
6. Embeddings are added to a **FAISS IndexFlatIP** and persisted to disk
7. The retriever cache is reset to load the fresh index

### 2. Query Pipeline

When you ask a question:

1. The query is encoded by the same BGE model
2. FAISS performs inner product search for the top 15 most similar chunks
3. Results are filtered for page diversity (max 1 chunk per page)
4. Top-k chunks (k=5 for short queries, k=8 for longer queries) are assembled into a context string
5. Context + query are formatted into a structured prompt and passed to **Flan-T5-base**
6. The generated answer is returned with page number citations

---

## Requirements

### Python (requirements.txt)

```
flask
flask-cors
torch
transformers
sentence-transformers
faiss-cpu
pypdf
nltk
```

### Node.js (frontend/package.json)

```
next 16.2.2
react 19.2.4
typescript 5.x
```

---

## Known Limitations

- **Scanned PDFs not supported** — requires text-based PDFs (no OCR)
- **CPU only** — no GPU acceleration, indexing large PDFs takes 30–60s
- **Flan-T5-base** struggles with complex multi-hop reasoning questions
- **Session state not persisted** — chat history clears on page refresh
- **Single user** — not designed for concurrent multi-user access

---

## Future Improvements

- Replace Flan-T5-base with Mistral-7B or Llama-3 via llama.cpp for better answer quality
- Add OCR support for scanned PDFs using Tesseract
- Persist chat history with SQLite
- Implement FAISS IVF indexing for large document collections
- Add hybrid BM25 + dense retrieval for improved accuracy
- Package as a desktop app with Electron or Tauri

---

## License

MIT License — free to use, modify, and distribute.

---

## Acknowledgements

- [BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) — embedding model
- [google/flan-t5-base](https://huggingface.co/google/flan-t5-base) — language model
- [FAISS](https://github.com/facebookresearch/faiss) — vector similarity search
- [pypdf](https://github.com/py-pdf/pypdf) — PDF parsing
