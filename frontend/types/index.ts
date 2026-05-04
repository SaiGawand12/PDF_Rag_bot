export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

export interface UploadedFile {
  id?: number;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  files: { id: number; filename: string; size: number; created_at: string }[];
}
