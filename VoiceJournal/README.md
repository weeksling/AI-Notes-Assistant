# Voice Journal - React Native App

A React Native mobile app built with Expo that allows users to record audio, transcribe it to text using speech-to-text, and generate AI-powered summaries and insights.

## 🚀 Features

- **Audio Recording**: Record voice notes directly in the app or import audio files
- **Speech-to-Text**: Transcribe audio to text (currently using mock implementation)
- **AI Summarization**: Generate summaries, journal prompts, and task lists from transcriptions
- **Note Management**: Edit, organize, and search through your voice notes
- **Local Storage**: All data stored locally for privacy using AsyncStorage
- **Tagging System**: Organize notes with custom tags
- **Clean UI**: Modern, minimal design with excellent UX

## 📱 Screenshots

*Coming soon - run the app to see the beautiful interface!*

## 🛠️ Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo AV** for audio recording and playback
- **AsyncStorage** for local data persistence
- **Expo Document Picker** for file selection

## 🏗️ Architecture

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── AudioRecorder.tsx    # Audio recording interface
│   ├── NoteEditor.tsx       # Note editing interface
│   ├── NoteCard.tsx         # Note list item component
│   └── LoadingSpinner.tsx   # Loading indicator
├── screens/              # Screen components
│   ├── HomeScreen.tsx       # Main dashboard
│   ├── RecordScreen.tsx     # Recording workflow
│   └── NoteEditorScreen.tsx # Note editing screen
├── services/             # Business logic services
│   ├── StorageManager.ts    # Local data management
│   ├── TranscriptionHandler.ts # Speech-to-text service
│   └── LLMSummarizer.ts     # AI summarization service
├── types/                # TypeScript type definitions
└── navigation/           # Navigation configuration
```

### Data Flow
1. **Audio Input** → AudioRecorder component captures audio
2. **Transcription** → TranscriptionHandler converts speech to text
3. **Summarization** → LLMSummarizer generates insights
4. **Storage** → StorageManager persists data locally
5. **Display** → UI components render the processed note

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS) or Android Emulator (for Android)
- Expo Go app on your physical device (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VoiceJournal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 📝 Usage

### Creating a Voice Note
1. Tap "🎙️ New Recording" on the home screen
2. Choose to record audio or select an existing file
3. Wait for automatic transcription and AI processing
4. Review and edit your note in the editor
5. Add tags and save

### Managing Notes
- **Search**: Use the search bar to find notes by content or tags
- **Edit**: Tap any note to view and edit it
- **Delete**: Tap the delete button on note cards
- **Tags**: Add comma-separated tags when editing notes

## 🔧 Current Implementation Status

### ✅ Completed (MVP)
- Basic app structure and navigation
- Audio recording with Expo AV
- File picker for audio imports  
- Mock transcription service with realistic delays
- Mock AI summarization with different content types
- Local storage with AsyncStorage
- Note editing and management
- Search and filtering
- Clean, responsive UI

### 🚧 Next Steps (Production Ready)

#### 1. Speech-to-Text Integration

**Option A: Cloud-based (Recommended for MVP)**
```typescript
// Example: OpenAI Whisper API
const transcribeWithWhisper = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a'
  } as any);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Option B: On-device (Better for privacy)**
```bash
# Install react-native-voice for real-time transcription
npm install @react-native-voice/voice

# Or react-native-whisper for local Whisper model
npm install react-native-whisper
```

#### 2. LLM Integration

**Cloud Options:**
- OpenAI GPT-4 API
- Anthropic Claude API  
- Google Gemini API
- AWS Bedrock

**Example OpenAI Integration:**
```typescript
const generateSummary = async (text: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates summaries and insights from voice notes.'
        },
        {
          role: 'user',
          content: `Please analyze this transcription and provide a summary, potential journal prompts, and any actionable tasks: ${text}`
        }
      ],
      max_tokens: 500,
    }),
  });

  return await response.json();
};
```

#### 3. Enhanced Storage

**SQLite Integration:**
```bash
npm install expo-sqlite
```

```typescript
// Replace AsyncStorage with SQLite for better performance
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('voicejournal.db');

const createTables = () => {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        original_text TEXT,
        edited_text TEXT,
        summary TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
  });
};
```

#### 4. Advanced Features
- **Audio playback** with waveform visualization
- **Backup/sync** to cloud storage (iCloud, Google Drive)
- **Export options** (PDF, text files)
- **Voice commands** for hands-free operation
- **Offline mode** with sync when online
- **Analytics** for usage insights

## 🔒 Privacy & Security

- All data stored locally by default
- No data sent to external services without explicit user consent
- Audio files and transcriptions never leave the device unless user chooses cloud features
- Future cloud features will include end-to-end encryption options

## 📦 Dependencies

### Core
- `expo`: ~51.x.x
- `react-native`: 0.74.x
- `typescript`: ~5.3.x

### Navigation
- `@react-navigation/native`: Latest
- `@react-navigation/stack`: Latest

### Audio & Files
- `expo-av`: Latest
- `expo-document-picker`: Latest

### Storage
- `@react-native-async-storage/async-storage`: Latest

### UI & Utils
- `react-native-safe-area-context`: Latest
- `react-native-screens`: Latest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Roadmap

- [ ] Real speech-to-text integration
- [ ] LLM API integration
- [ ] SQLite database migration
- [ ] Audio playback with controls
- [ ] Cloud backup options
- [ ] Sharing capabilities
- [ ] Widget support
- [ ] Voice commands
- [ ] Multi-language support
- [ ] Themes and customization

## 🆘 Troubleshooting

### Common Issues

**Audio recording not working:**
- Ensure microphone permissions are granted
- Check if running on physical device (simulator has limited audio support)

**Navigation errors:**
- Make sure all navigation dependencies are installed
- Clear Metro cache: `npx expo start --clear`

**Build issues:**
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Clear Expo cache: `npx expo install --fix`

### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Visit [React Navigation docs](https://reactnavigation.org/)
- Open an issue in this repository for bugs
- Join the [Expo Discord](https://chat.expo.dev/) for community support

## 📧 Contact

For questions or suggestions, please open an issue or contact the maintainers.

---

**Happy voice journaling! 🎙️📝**