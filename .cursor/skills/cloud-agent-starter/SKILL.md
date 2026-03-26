# Cloud Agent Starter Skill (VoiceJournal)

Use this skill when you need to quickly run, validate, or debug this repository in Cursor Cloud.

## 1) First 5 minutes (do this first)

### Workspace + install
1. `cd /workspace/VoiceJournal`
2. `npm install`
3. `npm run typecheck`

### Login / credentials
- **Appetize (required for cloud device tests):**
  - Create `/workspace/VoiceJournal/.env` with:
    - `APPETIZE_API_KEY=<your_key>`
  - Never commit `.env`.
- **Expo/EAS (only if you need cloud builds/publishing):**
  - `npx expo whoami` (if needed: `npx expo login`)
  - `npx eas whoami` (if needed: `npx eas login`)

### Quick sanity run
- Local app server: `npx expo start --non-interactive`
- Web smoke fallback: `npm run test:web`

## 2) Codebase areas and practical test workflows

### Area A: App shell + UI flow
Files:
- `App.tsx`
- `src/screens/*`
- `src/components/*`
- `src/navigation/*`

Run:
1. `npm run typecheck`
2. `npx expo start --non-interactive` (or `npm run web`)
3. If testing cloud Android behavior, run `npm run test:quick`

Success signals:
- TypeScript passes.
- Expo starts without immediate runtime errors.
- Quick Appetize smoke test passes for app launch.

### Area B: Transcription + summarization services (mock-first)
Files:
- `src/services/TranscriptionHandler.ts`
- `src/services/LLMSummarizer.ts`

Current behavior:
- This codebase already runs in **mock mode by default** for transcription and LLM summarization.
- No extra feature flag is required to get deterministic, testable behavior in Cloud.

Run:
1. `npm run typecheck`
2. Start app (`npx expo start --non-interactive`)
3. Trigger note flow in app; verify generated transcription/summary content appears and no crash occurs.
4. For cloud regression: `npm run test:functional`

When introducing real APIs:
- Keep a mock path available for Cloud runs.
- Gate live API calls behind environment variables and document them in this skill.

### Area C: Cloud APK + Appetize automation
Files:
- `scripts/*appetize*.js`
- `tests/e2e/*`
- `tests/utils/test-runner.js`
- `playwright.config.js`

Run:
1. Build APK: `npm run build:android`
2. Upload APK: `npm run upload:appetize`
3. Smoke tests: `npm run test:smoke`
4. Functional tests: `npm run test:functional`
5. Fast iteration: `npm run test:quick`

Important:
- `APPETIZE_API_KEY` is required.
- `appetize-app-info.json` must exist (created by upload step) before Playwright/Appetize tests run.

Debug helpers:
- `npm run test:diagnose`
- `npm run test:android-logs`
- `npm run test:debug`

### Area D: Build/release plumbing
Files:
- `android/*`
- `app.json`
- `eas.json`
- root `cursor.json` (agent build/test expectations)

Run:
1. `npm run typecheck`
2. `npm run build:android`
3. Optional release build: `npm run build:android:release`
4. Re-run `npm run test:quick` after build-related changes

## 3) Minimal workflow playbooks

### Playbook: "I changed UI/screens only"
1. `npm run typecheck`
2. `npx expo start --non-interactive`
3. `npm run test:quick`

### Playbook: "I changed service logic"
1. `npm run typecheck`
2. `npm run test:functional`
3. `npm run test:smoke`

### Playbook: "I changed Android/build/test infra"
1. `npm run typecheck`
2. `npm run build:android`
3. `npm run upload:appetize`
4. `npm run test:smoke`

## 4) How to keep this skill up to date

When you discover a new runbook trick, add it immediately:
1. Add it under the correct area section above (A/B/C/D).
2. Include exact command(s), required env vars, and expected success signal.
3. Remove or rewrite stale steps if they fail in two consecutive agent runs.
4. Keep entries concise and copy/paste ready for Cloud agents.

Update rule of thumb:
- If a command is required to unblock typical agent work (setup, login, start, mock, test, debug), it belongs in this file.
