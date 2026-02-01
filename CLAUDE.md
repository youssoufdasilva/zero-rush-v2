# CLAUDE.md - AI Agent Guide for Zero Rush v2

This file provides guidance to AI coding assistants working on the Zero Rush v2 codebase.

## Project Overview

**Zero Rush** (may rename to "Dusk & Dawn") is a mathematical puzzle game where players arrange operation cards (+, -, ×, ÷) to find both the **lowest** (dusk) and **highest** (dawn) positive whole numbers achievable.

**Key Mechanic**: Left-to-right evaluation (no PEMDAS). First card's operator is ignored.

## Documentation

Read these in order:
1. `docs/QUICK-REFERENCE.md` - 1-page overview
2. `docs/DECISIONS.md` - Why decisions were made
3. `docs/IMPLEMENTATION-NOTES.md` - Technical details

## Current Implementation Status

### Implemented ✅
- **Single-player practice mode** - All 4 difficulty levels (Easy/Medium/Hard/Challenger)
- **11 game components** - Complete UI for gameplay
- **2 custom hooks** - State management and sound effects
- **Core game logic** - Evaluation, generation, signatures
- **Settings system** - 9 configurable options persisted to localStorage
- **Mobile responsiveness** - Touch drag, auto card scaling, viewport meta

### Not Yet Implemented ❌
- Convex backend (auth, database, realtime)
- Daily puzzles (calendar UI, streak tracking)
- Multiplayer (rooms, scoring, simultaneous reveal)
- Gem currency system (earning, spending, shop)
- Hints system (UI and logic)
- PWA features (service worker, manifest)
- Analytics (PostHog integration)

## Architecture

```
zero-rush-v2/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles + Tailwind
├── components/
│   ├── ui/                # shadcn/ui components
│   └── game/              # Game components (11 total)
│       ├── game-board.tsx        # Main game container + settings persistence
│       ├── game-card.tsx         # Draggable card component
│       ├── game-controls.tsx     # Submit/Clear/New buttons
│       ├── hand.tsx              # Card hand area (bottom)
│       ├── card-slot.tsx         # Drop target for cards
│       ├── target-display.tsx    # Dusk/Dawn targets + current result
│       ├── victory-modal.tsx     # Win celebration modal
│       ├── submission-history.tsx # Past attempts list
│       ├── settings-dialog.tsx   # Settings modal (9 options)
│       ├── home-screen.tsx       # Start screen with difficulty
│       └── difficulty-selector.tsx # Difficulty picker
├── lib/
│   ├── types/
│   │   └── game.ts        # Core type definitions
│   ├── game/
│   │   ├── constants.ts   # Difficulty configs
│   │   ├── evaluate.ts    # Puzzle evaluation (solvePuzzle)
│   │   ├── generate.ts    # Puzzle generation
│   │   └── signature.ts   # Canonical signatures
│   ├── hooks/
│   │   ├── use-game.ts         # Game state management hook
│   │   └── use-sound-effects.ts # Web Audio sound effects
│   └── utils.ts           # shadcn utilities
├── convex/                # Backend functions (to set up)
├── public/                # Static assets
└── docs/                  # Documentation
```

## Core Algorithms

### Puzzle Evaluation
```typescript
// Left-to-right, first operator ignored
evaluate(['+9', '+1', '÷2', '-5']) 
// → 9 → 10 → 5 → 0
```

### Canonical Signature
```typescript
// Sort: + < - < * < ÷, then numeric
toSignature(['÷4', '*2', '+3', '-5']) // → '+3,-5,*2,÷4'
```

## Commands

```bash
bun install              # Install dependencies
bun --bun run dev        # Development server
bun --bun run build      # Production build
bun --bun run lint       # Run linter
bunx convex dev          # Run Convex backend locally (when set up)
```

> **Note**: Using `bun --bun` ensures Bun runtime (not Node) for maximum performance.

## Custom Hooks

### `useGame(difficulty)` — lib/hooks/use-game.ts
Central game state management:
- Card placement (hand ↔ arrangement)
- Drag-and-drop reordering
- Auto-calculated results (validates positive integers)
- Submission history with duplicate detection
- Dusk/dawn target tracking
- Attempt counting

### `useSoundEffects(enabled)` — lib/hooks/use-sound-effects.ts
Web Audio API sound effects:
- 10 sound types: cardAdd, cardRemove, submitValid, submitInvalid, duplicate, duskFound, dawnFound, puzzleComplete, clear, newPuzzle
- Client-only (SSR safe)
- Lazy AudioContext creation

## Settings System

9 configurable options persisted to localStorage:

**Gameplay:**
- `showTargetValues` — Reveal dusk/dawn values before finding
- `highlightMatches` — Highlight when result matches target
- `autoSubmit` — Submit automatically when all cards placed
- `soundEffects` — Enable/disable sound effects
- `clearAfterSubmit` — Return cards to hand after submit

**Display:**
- `controlsStyle` — "text-icons" | "icons-only"
- `historyPlacement` — "inline" | "drawer"
- `cardScaling` — "auto" | "scale" | "scroll" (for 8+ cards)
- `maxHistoryLength` — 5 | 10 | 15 | 20

## Testing Priorities

1. Puzzle evaluation correctness
2. Canonical signature bijection
3. Quality metrics (hasZero, isGood)
4. Submission duplicate detection
5. Settings persistence (localStorage)
6. Mobile drag-and-drop behavior

## Performance Notes

- 10 cards = 3.6M permutations
- Use web workers for heavy computation
- Profile `generateAnswers()` on mobile devices
- Target < 2s for puzzle generation

## Key Decisions

**Core (implemented):**
- **Left-to-right evaluation**: Non-negotiable, core game identity
- **Dual targets**: Both dusk AND dawn required
- **Quality system**: hasZero + isGood = perfect puzzle
- **Easy mode**: 4 cards (24 permutations)
- **Settings persistence**: localStorage for offline-first
- **Sound effects**: Web Audio API, client-only
- **Submission history**: Duplicate detection with flash feedback
- **Mobile drag**: TouchSensor with 150ms delay
- **Card scaling**: Scroll on mobile, scale on desktop (auto-detect)

**Future (planned):**
- **UTC midnight**: Global daily puzzle reset
- **Daily puzzles**: Online-only (treated as multiplayer mode)
- **Multiplayer scoring**: 0 (neither), 1 (one), 3 (both) — not speed-based
- **Auth**: OAuth via Convex
- **In-game currency**: 💎 gems (earn via streaks, spend on hints/skins/streak saves)
- **Hints cost 💎**: Creates meaningful tradeoff
- **Streak saves**: Only if missed exactly 1 day, costs 💎, unlimited uses
- **Streak transparency**: Display as "🔥 127 day streak (2 saves)"

## Tech Stack

- **Runtime/Package Manager**: Bun (`bun --bun`)
- **Frontend**: Next.js 16 + React 19 (PWA)
- **UI Components**: shadcn/ui (Nova style, amber theme)
- **Backend**: Convex (realtime + auth)
- **Hosting**: Vercel + Convex
- **Analytics**: PostHog

## Terminology

| Old (v1) | New (v2) |
|----------|----------|
| Sunset | Dusk (🔵 lowest) |
| Sunrise | Dawn (🟡 highest) |

## UI Theme

**shadcn/ui** with amber theme (dark mode primary):

**Dark mode (primary):**
- Background: Slate (`#0f172a`)
- Dusk: Sky-400 (`#38bdf8`) — bright blue
- Dawn: Amber-400 (`#fbbf24`) — golden

**Light mode:**
- Background: Slate-50 (`#f8fafc`)
- Dusk: Blue-700 (`#1d4ed8`) — deep blue
- Dawn: Amber-600 (`#d97706`) — rich gold

## Difficulty Levels

| Level | Cards | Zero Guarantee |
|-------|-------|----------------|
| Easy | 4 | ✅ On |
| Medium | 6 | ✅ On (default) |
| Hard | 8 | ❌ Off (default) |
| Challenger | 10 | ❌ Off (always) |

See `docs/IMPLEMENTATION-NOTES.md` for full technical details.
