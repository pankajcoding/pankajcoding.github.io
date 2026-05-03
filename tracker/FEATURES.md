# Deep Work Tracker — Feature Reference

Single-file app (`index.html`). All HTML, CSS, JS inline. Deployed at `pankajcoding.github.io/tracker/`.

---

## Timer

**Modes:** Pomodoro | Stopwatch (toggle at top)

**Pomodoro**
- Duration pills: 15 / 20 / 25 (default) / 30 / 40 / 45 / 50 min
- Circular SVG ring shows progress; ring flashes gold on completion
- Auto-completes and opens reflection modal when duration is reached
- Pomodoro count for today shown next to mode toggle

**Stopwatch**
- Counts up freely; minimum 15 min to save a session
- FINISH button saves the session

**Controls:** START → PAUSE / GIVE UP (pomodoro) or FINISH (stopwatch) → RESUME

**Label input:** "What are you working on?" — attached to the saved session, editable after the fact

---

## Picture-in-Picture (PiP)

⧉ button floats a compact timer overlay (fixed, draggable-ish).  
Shows: mode, time, state dot, progress bar, PAUSE / GIVE UP buttons.  
Stays visible while navigating away from the timer tab.

---

## Session Tracking

- Today's sessions list below the timer, sorted newest-first
- Each card: time range, duration, type badge, editable label (tap to edit inline)
- **Bulk delete:** long-press any session card to enter select mode → tick multiple → DELETE

**Data saved per session:**
```
date, label, duration (secs), startedAt, endedAt, type (pomodoro|stopwatch),
focusRating, distractions[], note, brainDump, nextUp
```

---

## Post-session Reflection Modal

Appears automatically after every completed session.

| Field | Type | Notes |
|---|---|---|
| Distractions | Multi-select chips | 14 presets + custom "Other" text |
| Focus rating | 1–5 stars | |
| Any thoughts? | Text input, 200 chars | Quick session note |
| Brain dump | Textarea, 400 chars | Offload anything on your mind; also saved as a `post` journal entry |
| What's next? | Text input, 200 chars | Pre-filled hint with previous intention |

SAVE stores all fields on the session. SKIP saves session with no reflection data.  
Tapping the backdrop = SKIP.

---

## Interstitial Journal

ADHD-friendly timestamped note capture. Three entry points:

### 1. Quick Capture FAB
- Blue pencil button, bottom-right, always visible after login
- Keyboard shortcut: **`J`** (when not in a text field)
- Slide-up panel with auto-focused textarea (max 500 chars)
- Placeholder rotates: "What's on your mind?", "Brain dump it…", "Quick thought…", "Capture before it vanishes…", "Note to self…"
- **Enter** saves · **Esc** / backdrop click dismisses
- Char hint appears at 450+ chars
- "Saved ✓" micro-toast on save (1.2s)
- Saved as `type: "quick"` journal entry

### 2. Pre-session Intention Banner
- Slides down from top of screen 400ms after a pomodoro starts (timer already running — non-blocking)
- "What's the focus for this session?" textarea (max 100 chars)
- **START FOCUSED** saves the intention · **Skip** dismisses with no penalty
- Saved as `type: "pre"` journal entry
- Text carried forward as a hint in the "What's next?" field of the next reflection

### 3. Brain Dump (post-session)
- In the reflection modal after each session
- Saved as both a session field and a `type: "post"` journal entry

### Journal Log
- Collapsible section below today's sessions (click "JOURNAL" header to expand)
- **Date navigator:** ‹ Today › arrows step by day; "All" loads every entry ever
- **Search:** client-side substring match on text and tags; highlights matches with `<mark>`; searches within the current date range
- Each row: type badge (quick=blue · pre=green · post=yellow), text preview (120 chars), timestamp

### Revisit Trigger
- On first open of a new day, checks if the previous date with entries had ≥1 entry
- If yes, shows an info-tone card above the timer: "You captured N thoughts yesterday. Review →"
- "Review →" expands the journal log and navigates to that date
- Dismiss button hides the card for the rest of the current day

**Data per journal entry:**
```
text, type (quick|pre|post), sessionId (nullable), date, timestamp,
tags: string[]   ← parsed from #hashtags in text (added on save, backfilled by migration)
resolved: false  ← reserved for future use
```

**One-time migration:** on first login after schema update, all existing entries get `tags` and `resolved` backfilled. Flag: `localStorage[dwt_journal_v2_migrated]`.

---

## Stats Panel

Accessible via the STATS tab.

| Section | Content |
|---|---|
| Last 7 days | Bar chart — daily focus time |
| KPIs | Streak (days), This week (hours), All-time (hours), Best day |
| Patterns | Unlocks after enough data — 7-day heatmap by hour, AI insights, distraction impact list |

---

## Auth & Data

**Sign-in options:** Email/password · Google OAuth · Guest mode  
**Guest → auth migration:** Guest sessions automatically migrate to Firestore on first sign-in.

**Storage:**
| Mode | Sessions | Journal |
|---|---|---|
| Guest | `localStorage[dwt_guest_sessions]` | `localStorage[dwt_guest_journal]` |
| Signed in | Firestore `users/{uid}/sessions/{id}` | Firestore `users/{uid}/journal/{id}` |

**Firestore rules needed:**
```
match /users/{uid}/sessions/{id} { allow read, write: if request.auth.uid == uid; }
match /users/{uid}/journal/{id}  { allow read, write: if request.auth.uid == uid; }
```

---

## Theme

🌙 button in the header toggles light / dark. Dark is default.  
Implemented via `[data-theme="light"]` on `<html>`, persisted in `localStorage[dwt_theme]`.

---

## Tech Stack

- Vanilla HTML/CSS/JS — no build tool, no framework
- Firebase 10.12.0 (CDN) — Firestore + Auth
- Google Analytics (`gtag`) for usage events
- Fonts: DM Sans · Syne · JetBrains Mono (Google Fonts)
- Color palette: Google blue `#4285F4` · red `#EA4335` · yellow `#FBBC05` · green `#34A853`
