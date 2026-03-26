---
name: react-native-debugging
description: Debug React Native + Expo issues systematically (runtime errors, state bugs, navigation issues, performance, and device-specific problems). Use when debugging crashes, red screens, navigation problems, flaky behavior, slow renders, or when the user asks to “debug” a mobile issue.
---

# React Native debugging

## Triage steps
1. Reproduce reliably (device/simulator, platform, steps).
2. Identify whether it’s JS/TS (logic) vs native/build tooling.
3. Reduce to smallest failing component/function.

## Common failure buckets
- **State/update timing**: guard async updates; avoid setting state after unmount.
- **Navigation**: verify route names/params and router entry points.
- **Permissions**: mic/filesystem permissions on device.
- **Platform differences**: Android vs iOS path/permission differences.

## Local verification commands
- `cd VoiceJournal && npm run typecheck`
- `cd VoiceJournal && npm run test:smoke` (when UI flows are involved)

## Reporting
When proposing a fix, include:
- the suspected root cause
- the minimal code change
- how to verify (one command or short manual steps)
