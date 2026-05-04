from flask import Flask, render_template, request, session, jsonify
from flask_cors import CORS
from utils.pdf_loader import load_pdf
from utils.chunking import chunk_documents
from utils.embeddings import create_vector_store, delete_from_vector_store
from utils.retriever import retrieve, reset_cache
from utils.llm import generate_answer
from utils.database import db, Session as ChatSession, Message, UploadedFile
from datetime import datetime
import os
import logging
import threading
import uuid

logging.getLogger("pypdf").setLevel(logging.ERROR)

app = Flask(__name__)
app.secret_key = "rag_secret_key"
CORS(app, supports_credentials=True)

# SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///docmind.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory job tracker
jobs = {}

# Create tables on startup
with app.app_context():
    db.create_all()


# ─── Background PDF processing ────────────────────────────────────────────────

def process_pdf(job_id, file_path, filename, session_id, file_size):
    try:
        docs = load_pdf(file_path)
        chunks = chunk_documents(docs)
        create_vector_store(chunks, filename=filename)
        reset_cache()

        # Save file record to DB
        with app.app_context():
            chat_session = ChatSession.query.get(session_id)
            if chat_session:
                f = UploadedFile(
                    session_id=session_id,
                    filename=filename,
                    size=file_size
                )
                db.session.add(f)
                # Auto-title session from first PDF
                if chat_session.title == "New Chat":
                    chat_session.title = filename.replace(".pdf", "")
                chat_session.updated_at = datetime.utcnow()
                db.session.commit()

        jobs[job_id] = {"status": "done", "filename": filename}
    except Exception as e:
        jobs[job_id] = {"status": "error", "filename": filename, "error": str(e)}


# ─── Session routes ────────────────────────────────────────────────────────────

@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    """Return all sessions ordered by most recent."""
    sessions = ChatSession.query.order_by(ChatSession.updated_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@app.route("/api/sessions", methods=["POST"])
def create_session():
    """Create a new chat session."""
    s = ChatSession()
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict())


@app.route("/api/sessions/<int:session_id>", methods=["GET"])
def get_session(session_id):
    """Get a session with all its messages and files."""
    s = ChatSession.query.get_or_404(session_id)
    data = s.to_dict()
    data["messages"] = [m.to_dict() for m in
                        Message.query.filter_by(session_id=session_id)
                        .order_by(Message.created_at).all()]
    return jsonify(data)


@app.route("/api/sessions/<int:session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete a session and all its messages/files."""
    s = ChatSession.query.get_or_404(session_id)

    # Remove PDFs from disk and vectorstore
    for f in s.files:
        file_path = os.path.join(UPLOAD_FOLDER, f.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        delete_from_vector_store(f.filename)

    reset_cache()
    db.session.delete(s)
    db.session.commit()
    return jsonify({"message": "Session deleted"})


@app.route("/api/sessions/<int:session_id>/rename", methods=["POST"])
def rename_session(session_id):
    """Rename a session."""
    s = ChatSession.query.get_or_404(session_id)
    data = request.get_json()
    s.title = data.get("title", s.title)
    db.session.commit()
    return jsonify(s.to_dict())


# ─── Upload ────────────────────────────────────────────────────────────────────

@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "pdf" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["pdf"]
    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    session_id = request.form.get("session_id", type=int)

    # Create session if not provided
    if not session_id:
        s = ChatSession()
        db.session.add(s)
        db.session.commit()
        session_id = s.id

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "filename": filename}

    t = threading.Thread(
        target=process_pdf,
        args=(job_id, file_path, filename, session_id, file_size),
        daemon=True
    )
    t.start()

    return jsonify({"job_id": job_id, "filename": filename, "session_id": session_id})


@app.route("/api/status/<job_id>", methods=["GET"])
def api_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


# ─── Chat ──────────────────────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "No query provided"}), 400

    query      = data["query"]
    session_id = data.get("session_id")

    k = 8 if len(query) > 40 else 5
    retrieved_docs = retrieve(query, k=k)
    answer = generate_answer(query, retrieved_docs)

    # Persist messages if session provided
    if session_id:
        s = ChatSession.query.get(session_id)
        if s:
            db.session.add(Message(session_id=session_id, role="user", text=query))
            db.session.add(Message(session_id=session_id, role="bot",  text=answer))
            s.updated_at = datetime.utcnow()
            db.session.commit()

    return jsonify({"answer": answer})


# ─── Delete file ───────────────────────────────────────────────────────────────

@app.route("/api/delete", methods=["POST"])
def api_delete():
    data = request.get_json()
    if not data or "filename" not in data:
        return jsonify({"error": "No filename provided"}), 400

    filename   = data["filename"]
    session_id = data.get("session_id")
    file_path  = os.path.join(UPLOAD_FOLDER, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove from DB
    if session_id:
        UploadedFile.query.filter_by(
            session_id=session_id, filename=filename
        ).delete()
        db.session.commit()

    # Rebuild vectorstore from remaining PDFs
    remaining = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".pdf")]
    if not remaining:
        for p in ["vectorstore/faiss.index", "vectorstore/chunks.pkl", "vectorstore/hashes.json"]:
            if os.path.exists(p):
                os.remove(p)
    else:
        all_chunks = []
        for pdf in remaining:
            docs = load_pdf(os.path.join(UPLOAD_FOLDER, pdf))
            chunks = chunk_documents(docs)
            for c in chunks:
                c["source"] = pdf
            all_chunks.extend(chunks)
        for p in ["vectorstore/faiss.index", "vectorstore/chunks.pkl", "vectorstore/hashes.json"]:
            if os.path.exists(p):
                os.remove(p)
        create_vector_store(all_chunks)

    reset_cache()
    return jsonify({"message": f"{filename} deleted"})


# ─── Legacy HTML route ─────────────────────────────────────────────────────────

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
