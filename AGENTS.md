# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Voice Journal is a React Native / Expo mobile app for voice-first journaling. The entire codebase lives under `VoiceJournal/`. There are no backend services, databases, or external APIs — all storage is on-device via AsyncStorage and transcription/summarization use mock implementations.

### Running the app (web mode)

```bash
cd VoiceJournal && npx expo start --web
```

The web dev server starts on `http://localhost:8081`. The `package.json` `"main"` field points to `index.ts` (not `expo-router/entry`), which registers the root component via `registerRootComponent`.

### Lint / typecheck

```bash
cd VoiceJournal && npx tsc --noEmit
```

Note: the codebase has pre-existing TypeScript errors (primarily in `src/components/AudioRecorder.tsx` and `src/navigation/AppNavigator.tsx`). These are not regressions.

### Automated tests

E2E tests use Playwright against Appetize.io (cloud Android emulator) and require an `APPETIZE_API_KEY` in `VoiceJournal/.env`. They cannot run in a local-only environment. Commands are in `VoiceJournal/package.json` under `test`, `test:smoke`, `test:functional`, etc.

### Android APK build

Requires JDK 11+ and Android SDK (platform 33, build-tools 33.0.2):

```bash
cd VoiceJournal && npm run build:android
```

### Key gotchas

- The app entry point is `VoiceJournal/index.ts`, not the expo-router entry. The `"main"` field in `package.json` must be `"index.ts"`.
- `--non-interactive` flag is not supported by Expo CLI; use `CI=1` env var instead for non-interactive mode.
- Audio recording and file picker features require browser permissions in web mode. Recording will show a permission error in headless environments.
