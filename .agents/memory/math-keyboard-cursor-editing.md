---
name: MathKeyboard cursor-aware editing
description: How on-screen MathKeyboard insert/backspace must read the textarea caret in qr-course
---

# MathKeyboard cursor-aware insert/backspace

The on-screen `MathKeyboard` keys are plain `<button>`s with no `onMouseDown` focus
guard, so clicking a key **moves focus off the textarea** before the `onClick`
handler runs. Any consumer wiring insert/backspace must account for this.

**Rule:** read the caret straight from `textareaRef.current.selectionStart/selectionEnd`.
Do NOT gate the cursor logic on `document.activeElement === textarea` — at click time
the active element is the keyboard button, so that gate always falls through to
append/delete-at-end and breaks cursor-aware editing.

**Why:** a blurred textarea still retains its last `selectionStart/selectionEnd`, so
reading them directly inserts/deletes at the real caret even though focus is gone.
The shared `AnswerInput` (graded) still uses the `activeElement` gate and therefore
only edits at the end when you click a key; `MathChatInput` (tutor chat) reads the
selection directly and is the correct pattern.

**How to apply:** when adding a math-keyboard-backed field, mirror `MathChatInput`:
insert = `value.slice(0,start)+sym+value.slice(end)`, then restore caret via
`requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(pos,pos); })`.
Alternatively add `onMouseDown={e=>e.preventDefault()}` to the keys to stop focus
theft (would fix all consumers at once, including AnswerInput).
