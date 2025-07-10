
📝 Voice Journal — React Native App

Overview

Voice Journal is a minimal, private, voice-first journaling app.
It allows you to:

Record or upload audio notes

Transcribe speech to text

Automatically generate a summarized journaling prompt or task list using an LLM

Review, edit, tag, and save your notes locally


Future versions may include:

Calendar event or task creation

Local on-device summarization for privacy

Full voice navigation



---

✨ Features (MVP)

✅ Record audio or select existing file
✅ Transcribe to text (cloud or local speech-to-text)
✅ Summarize transcription into journal or task format
✅ Edit & tag notes
✅ Save all data locally (SQLite or JSON) for privacy


---

⚙️ Tech Stack

React Native + Expo (TypeScript)

Expo Audio / FileSystem for recording + file handling

Placeholder LLM summarization (dummy function)

AsyncStorage (or SQLite) for local persistence

Modular, clean component structure



---

🚀 Getting Started

# Install dependencies
npm install

# Run the app
expo start


---

🗂️ Project Structure

/VoiceJournal
│
├── components/
│   ├── AudioRecorder.tsx
│   ├── TranscriptionHandler.tsx
│   ├── Summarizer.tsx
│   ├── NoteEditor.tsx
│   └── NoteList.tsx
│
├── storage/
│   └── LocalStore.ts
│
├── utils/
│   └── summarizeDummy.ts
│
├── App.tsx
└── README.md


---

🛠 Next Steps

🔗 Integrate Expo Speech-to-Text or Android/iOS native speech API

🤖 Connect to an actual LLM (OpenAI, local model, or whisper for better offline)

🗄 Switch to SQLite for robust local storage

📅 Prototype task + calendar integrations

🔒 Ensure offline-first with zero external logging for privacy

🎨 Polish UI & add dark mode



---

🚧 Known Limitations

Currently uses a dummy summarizer function.

Only basic file handling, not yet streaming or chunk transcription.

No encryption yet — will add local encryption or secure storage for sensitive data.



---

❤️ Contributions & License

Built as a private personal project to explore local-first voice journaling.
Not intended for production or medical use.

MIT License.


---

✅ Done!
If you’d like, I can also generate:

a package.json starter with Expo + TypeScript + SQLite dependencies,

or a CONTRIBUTING.md if you want to eventually open source.


Want either of those? Let me know! 🚀



---


Initial prompt:

I want to build a mobile app in React Native that lets a user:

- Start an audio recording (or select an existing audio file).
- Transcribe that audio to text using an on-device speech-to-text library (or a cloud API for now, local later).
- Take the transcription and send it to an LLM to summarize it into a journaling prompt or a task list.
- Display the original text + the summary, let the user edit them.
- Let the user save this note, optionally tagging it.
- Store data locally in SQLite or simple JSON files for privacy.

This is just an MVP, so:
- Use Expo to start quickly, but be ready to eject if needed.
- Include separate components for recording, playback, transcription, summarization, and saving.
- Use async storage or SQLite for persistence.

Can you scaffold this project, create a basic file structure, and generate initial components with placeholders for:
1. Audio Recorder
2. Transcription Handler
3. LLM Summarizer (use a dummy function that returns a mocked summary for now)
4. Note Viewer/Editor
5. Local Storage manager

Use TypeScript and keep styles clean and minimal. Include a README with next steps for integrating actual speech-to-text and LLM calls.
