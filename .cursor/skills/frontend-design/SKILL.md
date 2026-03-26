---
name: frontend-design
description: Build consistent, production-ready React Native UI with clear visual hierarchy, spacing, accessibility, and component-level implementation patterns.
---

# Frontend Design Skill

Use this skill for UI component work, screen composition, styling decisions, and visual QA in the app.

## When To Use
- Creating or updating React Native screens/components.
- Improving visual hierarchy, spacing, and readability.
- Refactoring styles for consistency and maintainability.

## Core Guidelines
- Use a consistent spacing scale and typography hierarchy.
- Keep components small, reusable, and focused.
- Prefer composition over monolithic screen files.
- Ensure controls are visually and functionally accessible.
- Keep color usage semantic (primary, success, warning, error, neutral).

## React Native Implementation Patterns
- Centralize shared tokens (colors, spacing, radius, typography) in theme constants.
- Use `StyleSheet.create` for predictable, performant style declarations.
- Avoid deep nesting; flatten layout where possible.
- Ensure touch targets are large enough for mobile interaction.
- Support small and large screens by testing layout responsiveness.

## Accessibility Checklist
- Add meaningful `accessibilityLabel` to interactive elements.
- Preserve visible focus/pressed feedback.
- Ensure text contrast is readable on all backgrounds.
- Avoid color-only signaling for critical states.

## VoiceJournal-Specific Guidance
- Emphasize recording state clarity (idle, recording, processing).
- Keep transcript and summary sections visually distinct.
- Make save/edit/tag actions easy to find but not visually noisy.
- Maintain calm, minimal styling aligned with journaling use.

## Visual QA Checklist
- Spacing and alignment are consistent across sections.
- Headings, body text, and metadata are clearly differentiated.
- Empty, loading, and error states are visually complete.
- Buttons/inputs have coherent hover/pressed/disabled behavior (where applicable).
