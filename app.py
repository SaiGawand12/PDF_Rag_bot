from flask import Flask, render_template, request, session, jsonify
from flask_cors import CORS
from utils.pdf_loader import load_pdf
from utils.chunking import chunk_documents
from utils.embeddings import create_vector_store, delete_from_vector_store
from utils.retriever import retrieve, reset_cache
from utils.llm import generate_answer
import os
import logging
import threading
import uuid

logging.getLogger("pypdf").setLevel(logging.ERROR)

app = Flask(__name__)
app.secret_key = "rag_secret_key"
CORS(app, supports_credentials=True)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# job_id -> {"status": "processing"|"done"|"error", "filename": str, "error": str}
jobs = {}


def process_pdf(job_id, file_path, filename):
    try:
        docs = load_pdf(file_path)
        chunks = chunk_documents(docs)
        create_vector_store(chunks, filename=filename)
        reset_cache()
        jobs[job_id] = {"status": "done", "filename": filename}
    except Exception as e:
        jobs[job_id] = {"status": "error", "filename": filename, "error": str(e)}


@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "pdf" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["pdf"]
    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "filename": filename}

    # Run heavy work in background — return immediately
    t = threading.Thread(target=process_pdf, args=(job_id, file_path, filename), daemon=True)
    t.start()

    return jsonify({"job_id": job_id, "filename": filename})


@app.route("/api/status/<job_id>", methods=["GET"])
def api_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


@app.route("/api/delete", methods=["POST"])
def api_delete():
    data = request.get_json()
    if not data or "filename" not in data:
        return jsonify({"error": "No filename provided"}), 400

    filename = data["filename"]
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Remove file from disk
    if os.path.exists(file_path):
        os.remove(file_path)

    # Rebuild vectorstore from remaining PDFs
    remaining = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".pdf")]

    if not remaining:
        # No PDFs left — wipe the vectorstore
        for f in ["vectorstore/faiss.index", "vectorstore/chunks.pkl"]:
            if os.path.exists(f):
                os.remove(f)
    else:
        all_chunks = []
        for pdf in remaining:
            docs = load_pdf(os.path.join(UPLOAD_FOLDER, pdf))
            all_chunks.extend(chunk_documents(docs))
        # Wipe and rebuild fresh
        for f in ["vectorstore/faiss.index", "vectorstore/chunks.pkl"]:
            if os.path.exists(f):
                os.remove(f)
        create_vector_store(all_chunks)

    reset_cache()
    return jsonify({"message": f"{filename} deleted"})



@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "No query provided"}), 400

    query = data["query"]
    k = 8 if len(query) > 40 else 5
    retrieved_docs = retrieve(query, k=k)
    answer = generate_answer(query, retrieved_docs)

    return jsonify({"answer": answer})


@app.route("/", methods=["GET", "POST"])
def index():
    if "chat" not in session:
        session["chat"] = []

    if request.method == "POST":
        if "pdf" in request.files:
            file = request.files["pdf"]
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            docs = load_pdf(file_path)
            chunks = chunk_documents(docs)
            create_vector_store(chunks)
            session["chat"].append({"role": "bot", "text": "PDF processed successfully!"})
        elif "query" in request.form:
            query = request.form["query"]
            k = 8 if len(query) > 40 else 5
            retrieved_docs = retrieve(query, k=k)
            answer = generate_answer(query, retrieved_docs)
            chat = session["chat"]
            chat.append({"role": "user", "text": query})
            chat.append({"role": "bot", "text": answer})
            session["chat"] = chat

    return render_template("index.html", chat=session["chat"])


if __name__ == "__main__":
    app.run(debug=True)
