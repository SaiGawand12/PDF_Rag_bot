export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

export interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: Date;
}
