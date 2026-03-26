---
name: react-native-ui-design
description: Design and implement React Native screens/components with strong UX and production-grade UI. Use when designing screens, component styling, layout, theming (light/dark), accessibility, or when the user mentions design, mobile-design, UI polish, or frontend-design.
---

# React Native UI design

## Design defaults
- Prefer clean, minimal, touch-friendly UI.
- Use consistent spacing and typography; avoid one-off magic numbers.
- Optimize for one-handed use and thumb reach when practical.

## Accessibility checklist
- Use adequate contrast; avoid low-contrast placeholder text.
- Ensure tappable targets are comfortably sized.
- Add `accessibilityLabel` where icons/buttons don’t have visible text.

## Layout patterns
- Use `SafeAreaView` (or safe-area context) for top/bottom insets.
- Prefer flexbox layout over absolute positioning.
- Handle small screens: avoid fixed heights; allow scroll where content can grow.

## When editing existing UI
- Match existing patterns in `VoiceJournal/components`.
- Keep changes localized; avoid large restyles unless requested.
