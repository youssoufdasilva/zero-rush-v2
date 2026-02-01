# Zero Rush Quick Reference

> One-page summary for returning readers

---

## Current Features (Implemented)

- **Single-player practice mode** — All 4 difficulty levels
- **Full drag-and-drop gameplay** — Desktop mouse + mobile touch
- **Settings system** — 9 options persisted to localStorage
- **Sound effects** — Web Audio for game events
- **Submission history** — Duplicate detection, inline or drawer
- **Victory modal** — Celebration on finding both targets
- **Mobile responsive** — Touch drag, auto card scaling

---

## The Game in 30 Seconds

**Cards**: `+3`, `-5`, `*2`, `÷4` (operator + number)

**Goal**: Arrange cards to find:
- 🔵 **Dusk**: Lowest positive whole number (including 0) — sky blue (dark) / deep blue (light)
- 🟡 **Dawn**: Highest positive whole number — amber/gold

**Rules**:
- First card's operator is ignored
- Evaluate left-to-right (no PEMDAS)
- Find BOTH to win

**Example**: `9, +1, ÷2, -5` → 9 → 10 → 5 → **0** ✅

---

## Difficulty Levels

| Level | Cards | Zero Guaranteed |
|-------|-------|-----------------|
| Easy | 4 | ✅ On |
| Medium | 6 | ✅ On (default) |
| Hard | 8 | ❌ Off (default) |
| Challenger | 10 | ❌ Off (always) |

*Zero mode configurable per player. Challenger unlock not yet implemented.*

---

## Settings (9 Options)

**Gameplay:** Show target values, Highlight matches, Auto-submit, Sound effects, Clear after submit

**Display:** Controls style (text+icons / icons), History placement (inline / drawer), Card scaling (auto / scale / scroll), History length (5-20)

---

## Quality Indicators

| Border | Background | Meaning |
|--------|------------|---------|
| 🟢 | 🟢 | Perfect puzzle |
| 🟢 | 🟣 | Has zero |
| 🟣 | 🟢 | Good (unique dawn) |
| 🔴 | 🔴 | Invalid |

---

## Daily Puzzles (Planned)

- 3 puzzles daily (Easy, Medium, Hard)
- Resets at UTC midnight (displayed as GMT)
- Same for everyone worldwide
- **Requires online** (treated as multiplayer mode)
- Streak tracking (combined across difficulties) + text sharing

## In-Game Currency (Planned)

- Earn 💎 every 10 streaks
- Spend on: hints, skins, streak saves
- Streak save: costs 💎, only works if missed 1 day, unlimited uses
- Streak display shows saves: "🔥 127 day streak (2 saves)"

---

## Multiplayer (Planned)

**Scoring** (not speed-based — simultaneous reveal):

| Result | Points |
|--------|--------|
| Neither | 0 |
| Dusk OR Dawn | 1 |
| BOTH | 3 |

**Room settings**: Hand size (4-10), time limit (1-10 min), max rounds (3/5/8/10)

---

## Key Files

```
zero-rush-v2/
├── CLAUDE.md                    # AI agent guide
├── docs/
│   ├── QUICK-REFERENCE.md       # This file
│   ├── DECISIONS.md             # Design decisions log
│   └── IMPLEMENTATION-NOTES.md  # Tech details
├── components/game/             # 11 game components
│   ├── game-board.tsx           # Main container + settings
│   ├── game-card.tsx            # Draggable card
│   ├── hand.tsx                 # Card hand area
│   ├── target-display.tsx       # Dusk/Dawn targets
│   ├── victory-modal.tsx        # Win celebration
│   ├── submission-history.tsx   # Past attempts
│   └── settings-dialog.tsx      # Settings modal
├── lib/
│   ├── types/game.ts            # Core type definitions
│   ├── game/                    # Game logic modules
│   └── hooks/
│       ├── use-game.ts          # State management
│       └── use-sound-effects.ts # Web Audio sounds
```

---

## Canonical Signature

Cards sorted: `+` → `-` → `*` → `÷`, then by number (numeric)

Example: `÷4, *2, +3, -5` → `+3,-5,*2,÷4`

---

## Naming Note

Game is **"Zero Rush"** for now. May rename to **"Dusk & Dawn"** after testing phase.
