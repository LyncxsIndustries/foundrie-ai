# Feature Spec: Requirements Page Integration

## 1. Overview
Adjust the flow from Discovery Chat to the Requirements page. "Generate Requirements" should only appear in the chat section when marked as done, and the redirection should fetch and show generated requirements automatically.

## 2. Requirements
- Remove "Generate Requirements" from the Requirements Page header.
- Add "Generate Requirements" to the Discovery Chat section, visible only when chat is "DONE".
- Redirect to Requirements page only AFTER requirements are successfully generated, saved to the database, and fetched in the store.
- Auto-display the requirements immediately upon reaching the Requirements page.
