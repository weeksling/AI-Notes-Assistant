---
name: react-native-testing
description: Testing workflows for this React Native/Expo repo, including the project’s Node-based test runner and Playwright commands. Use when adding tests, running tests, validating changes, or when the user mentions smoke tests, functional tests, performance tests, or Playwright.
---

# React Native testing (repo-specific)

## Primary test entry points (from `VoiceJournal/package.json`)
- Full suite: `cd VoiceJournal && npm test`
- Smoke: `cd VoiceJournal && npm run test:smoke`
- Functional: `cd VoiceJournal && npm run test:functional`
- Performance: `cd VoiceJournal && npm run test:performance`
- Quick: `cd VoiceJournal && npm run test:quick`

## Playwright
- Install browsers: `cd VoiceJournal && npm run playwright:install`
- Run: `cd VoiceJournal && npm run playwright:test`

## Minimal validation after changes
- Always: `cd VoiceJournal && npm run typecheck`
- Then pick the smallest relevant test command above.
