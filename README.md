# VideoChat — Ask Your Video Anything

A two-column web app to upload a video, auto-generate its transcript, and chat with it using Claude AI.

---

## Architecture

```
videochat/
├── backend/
│   ├── app.py            ← Flask server (API + serves built frontend)
│   └── requirements.txt
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx       ← React UI (two-column layout)
│   │   └── index.js
│   └── package.json
├── start.sh              ← One-shot setup script
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/upload` | POST | Receives video file, returns filepath + transcript |
| `POST /api/query` | POST | Receives query + transcript + history, returns AI answer |
| `GET /api/video/<filename>` | GET | Serves uploaded video file for the player |

## Setup

### Requirements
- Python 3.9+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Install & build

```bash
cd videochat
chmod +x start.sh
./start.sh
```

### 2. Start the server

```bash
cd backend
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx python app.py
```

### 3. Open the app

Visit [http://localhost:5000](http://localhost:5000)

---

## Development mode (hot-reload)

Run backend and frontend separately:

```bash
# Terminal 1 — Flask backend
cd backend
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx python app.py

# Terminal 2 — React dev server (proxies /api to Flask)
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) for hot-reload React.

---

## Adding Real Transcription (Production)

The current backend uses Claude to generate a placeholder transcript.
For real audio transcription, integrate **OpenAI Whisper**:

```python
# In backend/app.py, replace generate_transcript() with:
import whisper

def generate_transcript(filepath, filename):
    model = whisper.load_model("base")
    result = model.transcribe(filepath)
    
    lines = []
    for seg in result["segments"]:
        t = int(seg["start"])
        h, m, s = t // 3600, (t % 3600) // 60, t % 60
        lines.append(f"[{h:02d}:{m:02d}:{s:02d}] {seg['text'].strip()}")
    return "\n".join(lines)
```

Install with: `pip install openai-whisper ffmpeg-python`

---

## Features

- **Two-column layout** — load data left, query right
- **Video upload** with file-path display
- **Custom video player** — play/pause, scrub bar, timestamps
- **Auto transcript extraction** — displayed in scrollable panel
- **Chat interface** — multi-turn conversation with history
- **Colorful, modern UI** — gradient accents, smooth animations
- **Built with** Flask + React + Claude API
