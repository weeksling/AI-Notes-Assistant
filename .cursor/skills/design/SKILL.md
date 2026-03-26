---
name: design
description: Apply practical product design standards for flows, information hierarchy, and implementation-ready UI decisions in this app.
---

# Design Skill

Use this skill when defining or reviewing product behavior, UX flows, and UI structure before or during implementation.

## When To Use
- Planning a new feature or changing an existing flow.
- Reviewing UX consistency across screens.
- Turning rough requirements into implementation-ready acceptance criteria.

## Workflow
1. Clarify user goal and primary task completion path.
2. Define the happy path plus at least two edge/failure states.
3. Establish information hierarchy (primary action, secondary action, metadata).
4. Ensure state feedback is explicit: loading, empty, success, and error.
5. Hand off clear implementation notes tied to existing components/screens.

## Design Principles
- Keep one dominant action per screen.
- Reduce cognitive load: concise copy and predictable layouts.
- Preserve continuity: retain context when moving between screens.
- Prefer progressive disclosure over dense UI.
- Make error states actionable with clear next steps.

## VoiceJournal-Specific Guidance
- Prioritize the recording-to-summary-to-save journey.
- Keep editing and tagging lightweight after transcription.
- Preserve privacy expectations in copy and interactions.
- Ensure offline-safe fallback messaging when network services are unavailable.

## Delivery Checklist
- Problem statement and success criteria are explicit.
- User flow documents happy path and failure paths.
- UI states are fully specified (loading/empty/error/success).
- Action labels are specific and unambiguous.
- Notes are implementation-ready for React Native/Expo screens.
