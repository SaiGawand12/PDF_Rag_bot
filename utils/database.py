from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Session(db.Model):
    """A chat session — like a ChatGPT conversation."""
    __tablename__ = "sessions"

    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), default="New Chat")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages   = db.relationship("Message", backref="session", lazy=True, cascade="all, delete-orphan")
    files      = db.relationship("UploadedFile", backref="session", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":         self.id,
            "title":      self.title,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "files":      [f.to_dict() for f in self.files],
        }


class Message(db.Model):
    """A single chat message inside a session."""
    __tablename__ = "messages"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    role       = db.Column(db.String(10), nullable=False)   # "user" or "bot"
    text       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "role":       self.role,
            "text":       self.text,
            "created_at": self.created_at.isoformat(),
        }


class UploadedFile(db.Model):
    """A PDF file associated with a session."""
    __tablename__ = "uploaded_files"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    filename   = db.Column(db.String(300), nullable=False)
    size       = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "filename":   self.filename,
            "size":       self.size,
            "created_at": self.created_at.isoformat(),
        }
