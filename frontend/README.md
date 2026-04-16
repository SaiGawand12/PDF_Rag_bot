# DocMind — Frontend

The Next.js frontend for the DocMind RAG chatbot. Provides a responsive chat interface for uploading PDFs and asking questions about their content.

> This is the frontend only. The Flask backend must be running on port 5000 for the app to function. See the [root README](../README.md) for full setup instructions.

---

## Tech Stack

- **Next.js 16** — React framework
- **TypeScript** — type-safe components
- **React 19** — UI library
- **System fonts** — no external font dependencies, works fully offline

---

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx            # Main chat page — all state management
│   ├── layout.tsx          # Root layout
│   └── globals.css         # CSS variables, animations, global styles
├── components/
│   ├── Sidebar.tsx         # PDF upload, document list, delete, clear chat
│   ├── ChatMessage.tsx     # Individual message bubble with page badges
│   ├── ChatInput.tsx       # Textarea input with send button
│   ├── EmptyState.tsx      # Onboarding screen with suggestion chips
│   └── TypingIndicator.tsx # Animated dots while AI is generating
└── types/
    └── index.ts            # Message and UploadedFile type definitions
```

---

## Getting Started

Make sure the Flask backend is running first:

```bash
# In the root directory
python app.py
```

Then start the frontend:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- Drag-and-drop PDF upload with processing status indicator
- Real-time polling for background indexing status
- Chat interface with user and bot message bubbles
- Page citation badges (`pg.X`) rendered inline in bot answers
- Suggestion chips on the empty state screen
- Delete documents from the sidebar — vectorstore rebuilds automatically
- Fully responsive — desktop sidebar + mobile bottom sheet
- Dark theme using CSS variables, no external UI library

---

## Backend API

The frontend communicates with the Flask backend at `http://localhost:5000`:

| Method | Endpoint | Used for |
|---|---|---|
| `POST` | `/api/upload` | Upload PDF, get `job_id` |
| `GET` | `/api/status/:job_id` | Poll indexing progress |
| `POST` | `/api/chat` | Send question, get answer |
| `POST` | `/api/delete` | Remove a document |

To change the backend URL, edit the `API` constant in `app/page.tsx`:

```ts
const API = "http://localhost:5000";
```

---

## Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
