# Feature Spec: Discovery Chat State & Logic

## 1. Overview
Fix the logic for Discovery Chat to track when it ends and correctly count messages. The AI should not ask endless questions. The feature must be marked as "DONE" upon completion and the state saved to the database.

## 2. Requirements
- Implement message counting and history review functionality in the Discovery Chat Modal.
- Allow users to discard chat or resume chat accurately.
- Track "DONE" state in the database when the chat concludes.
- The AI should have a dynamic stopping condition, asking fewer questions for simpler requirements and knowing when to stop.
- "Generate Requirements" button should mark the chat as done and save the state.
