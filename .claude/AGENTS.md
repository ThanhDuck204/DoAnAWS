
## Project Identity

Project Name: AI Meeting Workforce Platform

Product Positioning:

This is NOT an AI note-taking clone.

This product transforms meetings into execution.

Workflow:

Meeting
→ Transcript
→ AI Review
→ Summary
→ Action Items
→ Task Creation
→ Workspace Management
→ Execution Tracking
→ Governance & Billing

Primary Goal:

Help teams convert meeting discussions into measurable execution.

---

## Technology Stack

Frontend:

* React
* Vite
* JavaScript
* Context API
* TailwindCSS
* Framer Motion

Backend:

* Node.js
* Express

Authentication:

* Session-based authentication

Voice:

* Discord-like voice architecture

Billing:

* Free Pilot
* Business Ops
* Enterprise Governance

---

## Golden Rules

DO NOT rewrite existing UI.

DO NOT redesign components.

DO NOT replace architecture without strong reason.

DO NOT remove animations.

DO NOT introduce new state management libraries.

Reuse existing contexts and services whenever possible.

Preserve backward compatibility.

---

## Before Modifying Anything

1. Identify root cause.
2. Trace data flow.
3. Find existing implementation.
4. Reuse before creating new code.
5. Verify affected screens.

Never guess.

---

## Required Output

Before editing:

* Root cause analysis
* Files affected
* Implementation plan

After editing:

* Exact changes
* Verification checklist
* Risks
* Rollback strategy

---

## Verification Checklist

* npm run lint
* npm run build
* No console errors
* Existing UI unchanged
* Existing functionality preserved
* Session persistence verified

---

## Features That Must Never Break

Authentication

Workspace

Meetings

Voice

Tasks

Billing

Theme

Navigation

Analytics
