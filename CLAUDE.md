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

## Architecture

```
zero-rush-v2/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles + Tailwind
├── components/
│   ├── ui/                # shadcn/ui components
│   └── game/              # Game-specific components (to build)
├── lib/
│   ├── types/
│   │   └── game.ts        # Core type definitions
│   ├── game/
│   │   ├── constants.ts   # Difficulty configs
│   │   ├── evaluate.ts    # Puzzle evaluation (solvePuzzle)
│   │   ├── generate.ts    # Puzzle generation
│   │   └── signature.ts   # Canonical signatures
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

## Testing Priorities

1. Puzzle evaluation correctness
2. Canonical signature bijection
3. Quality metrics (hasZero, isGood)
4. Timer accuracy
5. Offline/sync behavior

## Performance Notes

- 10 cards = 3.6M permutations
- Use web workers for heavy computation
- Profile `generateAnswers()` on mobile devices
- Target < 2s for puzzle generation

## Key Decisions

- **Left-to-right evaluation**: Non-negotiable, core game identity
- **Dual targets**: Both dusk AND dawn required
- **Quality system**: hasZero + isGood = perfect puzzle
- **UTC midnight**: Global daily puzzle reset
- **Daily puzzles**: Online-only (treated as multiplayer mode)
- **Multiplayer scoring**: 0 (neither), 1 (one), 3 (both) — not speed-based
- **Auth**: OAuth via Convex
- **In-game currency**: 💎 gems (earn via streaks, spend on hints/skins/streak saves)
- **Hints cost 💎**: Creates meaningful tradeoff
- **Streak saves**: Only if missed exactly 1 day, costs 💎, unlimited uses
- **Streak transparency**: Display as "🔥 127 day streak (2 saves)"
- **Easy mode**: 4 cards (24 permutations)

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
