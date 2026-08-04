# Feature Spec: Discovery Chat UI Fixes

## 1. Overview
Fixing visual bugs in the Discovery Chat UI based on user feedback. The chat input should stay anchored to the bottom of the viewport and should not be scrollable past the viewport. Only the message area should scroll, with automatic scrolling to the latest message. Chat bubbles must properly enclose text and images independently.

## 2. Requirements
- Ensure chat input is sticky/anchored to the bottom of the viewport.
- Restrict scrolling on the entire page so only the message container is scrollable.
- Auto-scroll to the bottom of the chat container when a new message arrives.
- Fix chat message bubbles so text is in its own box and images in their own boxes.
