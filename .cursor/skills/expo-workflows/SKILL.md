---
name: expo-workflows
description: Expo + React Native workflow helper: running the app, prebuild, Android builds, and common Expo gotchas. Use when working on Expo, expo-router, EAS, prebuild, Android builds, or when the user asks how to run/build/debug the mobile app.
---

# Expo workflows

## Default working directory
- Treat `VoiceJournal/` as the app root.

## Run / iterate
- Install: `cd VoiceJournal && npm install`
- Start dev server: `cd VoiceJournal && npm run start`
- Typecheck: `cd VoiceJournal && npm run typecheck`

## Android builds (local)
- Debug APK: `cd VoiceJournal && npm run build:android`
  - This runs `expo prebuild --platform android` then Gradle `assembleDebug`.

## Guardrails
- Avoid manual edits to `VoiceJournal/android` and `VoiceJournal/ios` unless explicitly required; prefer changing JS/TS or Expo config and regenerating via prebuild.
- When diagnosing native build failures, first re-run `npm run typecheck`, then re-run the build and capture the *first* Gradle error (later ones are often cascading).
