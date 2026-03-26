---
name: expo
description: Build, debug, and validate Expo React Native changes in this repository with reliable local and cloud-agent workflows.
---

# Expo Skill

Use this skill for Expo CLI workflows, React Native runtime debugging, and build/test validation in this repository.

## When To Use
- Running the app locally via Expo.
- Troubleshooting Metro, type errors, Android prebuild, or APK generation.
- Validating mobile-related changes before committing.

## Standard Commands
- Install dependencies: `cd VoiceJournal && npm install`
- Type-check: `cd VoiceJournal && npm run typecheck`
- Start app: `cd VoiceJournal && npx expo start`
- Start web preview: `cd VoiceJournal && npx expo start --web --non-interactive`
- Android prebuild: `cd VoiceJournal && npx expo prebuild --platform android`
- Debug APK build: `cd VoiceJournal/android && ./gradlew assembleDebug`

## Debugging Workflow
1. Confirm dependencies and lockfile are in sync.
2. Run type-check before runtime debugging.
3. Reproduce issue with a single explicit command.
4. Capture exact error output and isolate failing layer:
   - TypeScript compile
   - Metro bundling
   - Expo prebuild
   - Gradle/native build
5. Apply minimal fix and re-run only the relevant checks.

## Common Fixes
- Metro cache issues: `cd VoiceJournal && npx expo start --clear`
- Dependency drift: `cd VoiceJournal && npx expo install --fix`
- Native project mismatch after config/plugin edits: re-run prebuild for Android.
- Build failures in Gradle: validate Expo module/plugin compatibility before code-level changes.

## PR-Ready Validation
- Run `npm run typecheck` in `VoiceJournal`.
- Run the narrowest relevant Expo command for the change.
- For Android/native-affecting changes, validate prebuild and debug APK assembly path.
- Include any runtime caveats and exact commands used in the PR notes.
