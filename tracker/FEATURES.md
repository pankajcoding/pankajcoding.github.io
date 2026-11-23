# Deep Work Tracker — Feature Reference

Single-file app (`index.html`). All HTML, CSS, JS inline. Deployed at `pankajcoding.github.io/tracker/`.

---

## Timer

**Modes:** Pomodoro | Stopwatch (toggle at top)

**Pomodoro**
- Duration pills: 15 / 20 / 25 (default) / 30 / 35 / 40 / 45 / 50 min
- Circular SVG ring shows progress; ring flashes gold on completion
- Auto-completes and opens reflection modal when duration is reached
- **End alert:** a one-shot timeout fires at the exact end time, because background tabs throttle the 500ms tick to as slow as once a minute. The chime plays through an audio context unlocked on START/RESUME, so it works from a background tab. If the page isn't in front, a system notification "Pomodoro done 🍅" shows the task, minutes and today's count; clicking it focuses the tracker tab (`notificationclick` in `sw.js`). Notification permission is requested on the first START. Only the device that claims the end (see live sync) alerts. A locked phone can't be alerted: the browser suspends the page, and that would need push from a server
- Pomodoro count for today shown next to mode toggle

**Stopwatch**
- Counts up freely; minimum 15 min to save a session
- FINISH button saves the session

**Controls:** START → PAUSE / GIVE UP (pomodoro) or FINISH (stopwatch) → RESUME

**Last 15 / 30 days card:** at the bottom of the timer screen, a compact version of the stats chart (same drawing code and colours) showing avg/day and goal days. A **15d / 30d** switch in its header is remembered per device (`localStorage[dwt_month_range]`). Tap anywhere else on the card to open Stats. Hidden in focus mode.

**Label input:** "What are you working on?" — attached to the saved session, editable after the fact

**Live sync across devices (signed in only)**
- Start on one device and every other open device shows the same running timer; pause / resume / stop from any of them
- Firestore doc `users/{uid}/meta/activeTimer` holds the session; it's written on start, pause, resume and end, and other devices calculate the live time from `runStartedAt`
- Every device running the timer writes a `lastSeen` heartbeat every 30s (same cadence as the local crash backup)
- **Lost session:** if no device has checked in for 3+ min (tab closed, laptop asleep, phone locked), the timer pauses at the last check-in and a card asks: **Keep all time** (counts the gap and resumes) or **Stop at <time>** (ends it there → reflection if ≥ 5 min). This applies whether the gap is found when a device opens or when the sleeping device itself wakes up; it first checks whether another device kept tracking
- When a session ends, the doc keeps an `{sid, state: 'ended'}` marker so other devices stop too; a stale pause or resume that brings back an ended session gets reverted
- When a Pomodoro reaches zero, every open device tries to claim it through a transaction; only the winner shows the reflection and saves it (a hidden tab waits 3s so a visible device wins)
- If two sessions were started separately (e.g. offline), the one that started earlier wins; the other is saved first if it reached 5 min

---

## Picture-in-Picture (PiP)

⧉ button opens a floating always-on-top window (Document PiP, Chrome 116+), 240×270 and resizable.
Shows: 🍅 Pomodoro / ⏱ Stopwatch label, today's 🍅 count, a progress ring (counts down for Pomodoro, fills each hour for Stopwatch, same colours as the main ring including Aurora's gradient), time + state, and the current task.
Buttons: **START** when idle (so you can begin the next Pomodoro without switching tabs), **PAUSE/RESUME** and **GIVE UP/FINISH** while running.
Uses the active theme's colours and fonts and updates live when the theme changes.

---

## Session Tracking

- Today's sessions list below the timer, sorted newest-first
- Each card: time range, duration, type badge, editable label (tap to edit inline)
- A session is dated by when it **started**, not when it was saved — rating it (or recovering it) the next day keeps it on the original day
- A finished session waiting in the reflection modal is kept in crash recovery, so closing the tab before rating doesn't lose it
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
- Finished sessions are **not** journal entries: they live in Today's sessions, Stats → History and the charts. Older builds logged each session as a `pomodoro`/`stopwatch` journal entry ("25m · label"); those stay in storage but are hidden everywhere (journal log, History, revisit count) via `isNoteEntry`

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

## Break System

### Post-session suggestion sheet
- Slides up automatically 350ms after every completed session (after reflection is saved)
- Context-aware subtitle: "Long session — your body needs a real break" / "Quick check-in — try a micro-reset" / "You've been focused — rest your mind"
- 6 activity cards, smart-scored by time of day, session length, and recency; first card is pre-selected
- Anti-distraction reminder: "avoid phone & social during your break"
- START BREAK → countdown timer · SKIP / backdrop click → dismiss

### Break tab
- BREAK tab in nav; shows 6 smart suggestions
- Tap any card → countdown starts immediately (no select step)
- ↻ Refresh button re-runs suggestion engine
- Recent Breaks list: last 5 breaks with time-ago labels

### Break countdown
- Full-screen overlay, MM:SS in green (turns yellow at ≤30s)
- If activity has a link: link button shown, auto-opens after 600ms
- If activity has `openJournal: true`: opens Quick Capture panel (brain dump)
- DONE → logs break · END EARLY → logs break as ended early

### Break Impact

Shown below Recent Breaks when ≥3 breaks have been logged (all sessions are loaded on demand if the Stats tab hasn't been opened yet).  
Finds sessions that started within 30 min of each break type, averages their focus rating, and shows a ranked bar chart.  
Requires ≥2 qualifying sessions per activity name to appear.

### Customize Library
- Collapsible editor in Break tab
- Per-activity: name, duration (min), optional URL
- Add new activities, delete existing ones
- SAVE LIBRARY persists to Firestore (auth) or localStorage (guest)

### Smart suggestion algorithm
- Base score 10 per activity
- Morning (<12h): +5 breathing/stretching
- Evening (≥18h): +5 stillness/eye reset
- Long session (>45min): +6 active reset, +4 stretching
- Short session (<20min): +6 eye reset/breathing
- Recently used: −2 to −10 (most recent = −10)
- Random jitter: +0–2
- Greedy pick 6 with category variety; index 0 = recommended

### Data
```
break_library (Firestore: users/{uid}/break_library/lib | guest: dwt_guest_break_library)
  → { categories: [{ id, name, activities: [{ id, name, defaultDuration, links[], openJournal? }] }] }

break_log (Firestore: users/{uid}/break_log/{id} | guest: dwt_guest_break_log)
  → { activityId, name, category, durationSecs, date, timestamp }

dwt_break_recents (localStorage, device-local)
  → [{ activityId, name, category, ts }]  // max 5
```

---

## Stats Panel

Accessible via the STATS tab.

| Section | Content |
|---|---|
| Daily chart | SVG column chart of daily focus over 7 / 15 / 30 days, with a summary row above it (avg/day, goal days, best day for that range). Days that hit the 3.5h goal are bright; days below it use a dimmer step of the same blue; empty days show as a small tick. There's a light 0/2h/4h scale, a green goal line with a "goal 3.5h" label, and only the best day gets a value label. Weeks (Monday start) are marked with faint alternating background bands, counted back from the current week. The axis has two rows: a day initial under every bar (today in bold) and the date at the start of each week (every date in the 7d view). Hover or tap a bar to show its date in a pill on the axis, plus a tooltip with date, hours, sessions, avg focus and distance from the goal. Colours come from the `--chart-*` CSS variables (per theme) |
| KPIs | Streak (days), This week (hours), All-time (hours), Best day |
| Top tasks | Appears when ≥3 unique session labels exist — top 5 tasks by total focus time (horizontal bar, duration labels) |
| Top distractions | Horizontal bar chart; custom "other: text" distractions shown by their actual text, not collapsed to "Other" |
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
match /users/{uid}/meta/{id}     { allow read, write: if request.auth.uid == uid; }
```

---

## Theme

🎨 button in the header opens the theme picker (Esc or tapping outside closes it).

**13 themes**, each a set of CSS variables (colours, ring colours, chart colours, fonts) defined in `THEMES` in `index.html`:
- Dark: Current (default), Ember, Forest, Nocturne, Mono + Lime, Ocean, Aurora (gradient ring while running), Neon, Graphite
- Light: Arctic (the old light mode), Dawn, Matcha, Sakura

**How it applies:** `applyTheme(id)` sets the variables on `<html>`, sets `data-theme="light"` for light themes (the few light-only CSS rules still key off that), loads the theme's Google Fonts on demand, and updates the PiP window and the timer ring. Accent tints use `color-mix()` on `--blue`, so nothing needs a per-theme override.
- **No flash on load:** the resolved theme's variables are cached in `localStorage[dwt_theme_paint]`, and a small inline `<head>` script applies them before first render.
- **Follow system light / dark:** toggle in the picker. It uses the dark pick when the device is dark and the light pick when it's light (shown as "night" / "day" tags), and switches live with the device appearance.
- **Saved:** prefs `{ id, follow, dark, light }` are kept in `localStorage[dwt_theme_prefs]` and, when signed in, in Firestore `users/{uid}/meta/prefs` (`theme` field). They're read once at sign-in, so a change on one device reaches another on its next load or sign-in. The old `dwt_theme = light` setting is carried over as Arctic.
- Status colours (red delete, yellow warnings, the focus-quality heatmap scale) and Google-coloured icons stay the same in every theme.

**Adding a theme:** add a `makeTheme(...)` entry to `THEMES`. Check the chart pair (`below`, `hit`) with the dataviz palette validator against the theme's `card`, and keep `onAccent` on `accent` at ≥ 4.5:1.

---

## Offline / PWA

`sw.js` is network-first for `/tracker/` requests and falls back to the cache when offline, so new deploys load right away. Bump `CACHE` when changing caching behaviour so old caches are cleared on activate.

---

## Tech Stack

- Vanilla HTML/CSS/JS — no build tool, no framework
- Firebase 10.12.0 (CDN) — Firestore + Auth
- Google Analytics (`gtag`) for usage events
- Fonts: DM Sans · Syne · JetBrains Mono (Google Fonts)
- Color palette: Google blue `#4285F4` · red `#EA4335` · yellow `#FBBC05` · green `#34A853`
