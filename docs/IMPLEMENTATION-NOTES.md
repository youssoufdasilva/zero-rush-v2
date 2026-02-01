# Implementation Notes

> Technical details and implementation ideas captured during design discussions.
> For developer/AI agent reference during coding phase.

---

## Current Implementation

### Game State Management (`use-game` hook)

The `useGame` hook in `lib/hooks/use-game.ts` manages all game state:

```typescript
interface GameState {
  handCards: Card[];           // Cards not yet placed
  arrangementCards: Card[];    // Cards in play area
  difficulty: Difficulty;
  puzzleResult: PuzzleResult;  // Pre-calculated dusk/dawn
  foundDusk: boolean;
  foundDawn: boolean;
  attempts: number;
  currentResult: number | null; // Valid positive integer only
  rawResult: number | null;     // Including negatives/decimals
  isComplete: boolean;
  submissions: Submission[];
}
```

**Key features:**
- Auto-calculates result as cards are arranged
- Validates results (positive integers only)
- Tracks submission history with duplicate detection
- Signature-based duplicate checking (arrangement → string)

### Sound Effects (`use-sound-effects` hook)

Web Audio API implementation in `lib/hooks/use-sound-effects.ts`:

- **Client-only**: SSR-safe with lazy AudioContext creation
- **10 sound types**: cardAdd, cardRemove, submitValid, submitInvalid, duplicate, duskFound, dawnFound, puzzleComplete, clear, newPuzzle
- **Multi-step tones**: Some sounds play note sequences (duskFound, dawnFound, puzzleComplete)
- **Configurable**: Disabled via settings toggle

### Settings Persistence

Settings are stored in localStorage under `zero-rush-settings`:

```typescript
interface GameSettings {
  showTargetValues: boolean;    // Default: false
  highlightMatches: boolean;    // Default: true
  autoSubmit: boolean;          // Default: false
  soundEffects: boolean;        // Default: true
  clearAfterSubmit: boolean;    // Default: false
  controlsStyle: "text-icons" | "icons-only";  // Default: "text-icons"
  historyPlacement: "inline" | "drawer";       // Default: "inline"
  cardScaling: "auto" | "scale" | "scroll";    // Default: "auto"
  maxHistoryLength: number;     // Default: 10
}
```

### Mobile Drag-and-Drop

Uses `@dnd-kit` with:
- `TouchSensor` with 150ms activation delay (prevents accidental drags)
- `PointerSensor` for desktop
- Sortable lists for reordering
- Drop zones in arrangement area

### Card Scaling (8+ cards)

When hand has 8+ cards, the `cardScaling` setting controls layout:
- **auto**: Scroll on mobile (touch), scale on desktop
- **scale**: Always reduce card size to fit
- **scroll**: Always allow horizontal scrolling

---

## Future Implementation

### Convex Integration
- Use **Convex realtime database** for multiplayer functionality
- **Convex handles OAuth authentication**
- Avoids manual WebSocket management
- Built-in subscriptions for live room updates
- Mutations for game state changes
- Queries for leaderboards, room listings

### Data Models to Define
- `users` - player profiles, settings, stats, gem balance, streak data
- `games` - completed game records with timestamps
- `daily_puzzles` - pre-generated daily puzzle pool
- `rooms` - multiplayer room state
- `experiments` - A/B test configurations
- `transactions` - gem earning/spending history
- `puzzle_submissions` - player-submitted puzzles for review

### Tech Stack
- **Runtime/Package Manager**: Bun (`bun --bun` for runtime)
- **Frontend**: Next.js 16 + React 19 (PWA)
- **Backend**: Convex (realtime database + auth)
- **Hosting**: Vercel (frontend) + Convex (backend)
- **Analytics**: PostHog (user tracking, A/B testing)

### Commands
```bash
bun install              # Install dependencies
bun --bun run dev        # Dev server (uses Bun runtime)
bun --bun run build      # Production build
bunx convex dev          # Convex backend locally
```

---

## PWA & Offline (Future)

### What Syncs on Reconnect
- ✅ Completed games (with timestamps, attempts)
- ✅ User settings
- ✅ Starred/favorited puzzles
- ✅ Progress toward Challenger unlock

### What Does NOT Work Offline
- ❌ Daily puzzles (treated as multiplayer mode)
- ❌ Multiplayer rooms

### Offline Alternatives
- Replay past daily puzzles
- Play random practice puzzles
- View starred puzzles

### Service Worker Strategy
- Cache app shell and static assets
- Queue completed games for sync
- Do NOT cache daily puzzles (require online)

### IndexedDB Schema
- Local game history
- Starred/favorited puzzles
- Pending sync queue
- User settings (mirror of server)
- Challenger unlock progress

### Sync Protocol
1. On reconnect, check sync queue
2. Send pending game completions to server
3. Pull latest user data from server
4. Resolve conflicts (server wins for most data)

---

## UI Theme

### Component Library: shadcn/ui

Setup URL (pre-configured):
```
https://ui.shadcn.com/create?iconLibrary=hugeicons&base=base&style=nova&baseColor=gray&theme=amber&font=raleway&menuAccent=bold
```

**Config choices:**
- Icon library: Hugeicons
- Style: Nova
- Base color: Gray
- Theme: Amber (perfect for dawn/golden!)
- Font: Raleway
- Menu accent: Bold

### Color Palette

**Dark Mode (Primary):**
```css
:root {
  /* Slate base */
  --color-bg: #0f172a;            /* Slate-900 */
  --color-surface: #1e293b;       /* Slate-800 */
  --color-text: #f1f5f9;          /* Slate-100 */
  --color-text-muted: #94a3b8;    /* Slate-400 */
  
  /* Branded accents (bright for dark bg) */
  --color-dusk: #38bdf8;          /* Sky-400 - bright blue */
  --color-dawn: #fbbf24;          /* Amber-400 - golden */
}
```

**Light Mode:**
```css
[data-theme="light"] {
  /* Light base */
  --color-bg: #f8fafc;            /* Slate-50 */
  --color-surface: #ffffff;
  --color-text: #0f172a;          /* Slate-900 */
  --color-text-muted: #64748b;    /* Slate-500 */
  
  /* Branded accents (deeper for light bg) */
  --color-dusk: #1d4ed8;          /* Blue-700 - deep blue */
  --color-dawn: #d97706;          /* Amber-600 - rich gold */
}
```

### Usage Guidelines
- **Dusk (blue)**: Lowest target indicator, dusk-related UI elements
- **Dawn (amber/gold)**: Highest target indicator, dawn-related UI elements
- shadcn's amber theme handles dawn naturally
- Dark mode is primary (user preference)

---

## In-Game Currency (Future)

### Earning Gems
- Every 10 streaks = 💎 reward (amount TBD)
- Accepted puzzle submissions = 💎 reward (TBD)
- Future: purchasable for whales

### Spending Gems
- Hints (cost TBD per hint)
- Skins (e.g., 10💎 per skin)
- Streak saves (only if missed exactly 1 day)

### Transaction Schema
```typescript
interface Transaction {
  id: string;
  user_id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: 'streak_milestone' | 'puzzle_submission' | 'hint' | 'skin' | 'streak_save' | 'purchase';
  metadata?: Record<string, unknown>;
  created_at: number; // timestamp
}
```

### Streak Save Logic
```typescript
function canSaveStreak(user: User): boolean {
  const lastCompleted = user.last_daily_completed_at;
  const daysMissed = daysSince(lastCompleted);
  
  // Only allow save if exactly 1 day was missed
  // Unlimited uses allowed (transparency shows count)
  return daysMissed === 1 && user.gem_balance >= STREAK_SAVE_COST;
}
```

### Streak Display (Transparency)
Always show saves used to preserve achievement integrity:
```
🔥 127 day streak (2 saves)
🔥 45 day streak           // 0 saves, don't show "(0 saves)"
```

**Future consideration**: Separate leaderboards for "pure streaks" (0 saves) vs "total streaks".

---

## Puzzle Generation (Implemented + Future)

### Daily Puzzles (Pre-Generated)
Daily puzzles are **pre-generated and curated**, NOT dynamically generated from seed.

**Why pre-generated instead of seed-based:**
- Curated quality (manually verify `hasZero` and `isGood`)
- Prevents offline cheating (clock manipulation)
- Can ensure no repeats across days
- Can balance difficulty intentionally

**Storage:**
- Pool of curated puzzles per difficulty in database
- Scheduled job assigns puzzle to each day
- Fetched on app load (requires online)

### Player Puzzle Submissions

Players can submit puzzles they find interesting for consideration as future daily puzzles.

```typescript
interface PuzzleSubmission {
  id: string;
  user_id: string;
  puzzle_signature: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Auto-calculated on submission
  has_zero: boolean;
  is_good: boolean;
  dusk_value: number;
  dawn_value: number;
  
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: number; // timestamp
  reviewer_notes?: string;
  
  // If approved and used
  used_as_daily_date?: string;  // e.g., "2026-02-15"
  gems_awarded?: number;
  
  created_at: number; // timestamp
}
```

**Review Process:**
1. Player submits puzzle they encountered/created
2. System validates quality (hasZero, isGood)
3. Admin reviews for uniqueness and interest
4. If approved, added to daily puzzle pool
5. Player gets cited + earns 💎 when puzzle is used

### Canonical Signature Implementation
```typescript
function toCanonicalSignature(cards: Card[]): string {
  const operatorOrder: Record<string, number> = { '+': 0, '-': 1, '*': 2, '÷': 3 };
  
  return [...cards]
    .sort((a, b) => {
      // Sort by operator first
      if (operatorOrder[a.operator] !== operatorOrder[b.operator]) {
        return operatorOrder[a.operator] - operatorOrder[b.operator];
      }
      // Then by number (numeric, not lexicographic)
      return a.value - b.value;
    })
    .map(card => `${card.operator}${card.value}`)
    .join(',');
}
```

---

## Performance Considerations

### Permutation Explosion
| Cards | Permutations | Concern Level |
|-------|--------------|---------------|
| 4 | 24 | ✅ Trivial |
| 5 | 120 | ✅ Trivial |
| 6 | 720 | ✅ Fast |
| 7 | 5,040 | ⚠️ Noticeable |
| 8 | 40,320 | ⚠️ May need optimization |
| 10 | 3,628,800 | 🔴 Requires special handling |

### Optimization Strategies
1. **Web Worker**: Offload puzzle generation to background thread
2. **Early termination**: Stop if we find qualifying puzzle quickly
3. **Memoization**: Cache common subexpression results
4. **Pre-generation**: For daily puzzles, generate in advance

### Profiling Needed
- Benchmark `generateAnswers()` with 8, 10 cards
- Measure on low-end mobile devices
- Set acceptable time threshold (< 2s for generation?)

---

## A/B Testing Infrastructure (Future)

### Experiment Schema
```typescript
interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed';
  
  // Traffic allocation
  variants: {
    id: string;
    name: string;
    weight: number;  // 0-100, must sum to 100
    config: Record<string, unknown>;
  }[];
  
  // Targeting
  target_percentage: number;  // % of users in experiment
  
  created_at: number; // timestamp
  started_at?: number;
  ended_at?: number;
}
```

### Assignment Strategy
- Hash user ID + experiment ID for consistent assignment
- Store assignment in user record
- Same user always sees same variant

### Metrics Collection
```typescript
interface ExperimentMetric {
  experiment_id: string;
  variant_id: string;
  user_id: string;
  
  metric_name: string;  // 'completion_rate', 'time_to_solve', etc.
  metric_value: number;
  
  timestamp: number;
}
```

---

## Multiplayer Architecture (Future)

### Room State Machine
```
WAITING → STARTING → THINKING → REVEAL → SCORING → (next round or FINISHED)
   ↑                                         ↓
   └─────────────────────────────────────────┘
```

### Room Settings
```typescript
interface RoomConfig {
  hand_size: 4 | 5 | 6 | 7 | 8 | 9 | 10;
  time_limit_minutes: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  zero_mode: 'guaranteed' | 'open';
  visibility: 'private' | 'public';
  max_players: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  max_rounds: 3 | 5 | 8 | 10;
}
```

### Gameplay Flow
1. **WAITING**: Players join, host configures settings
2. **STARTING**: Countdown, deal cards
3. **THINKING**: Timer runs, players solve privately on own screen
4. **REVEAL**: Timer ends (or all submit), answers shown simultaneously
5. **SCORING**: Points awarded, leaderboard updated
6. **NEXT_ROUND** or **FINISHED**: If rounds < max_rounds, go to step 2. Else, show final results.

### Scoring System
| Result | Points |
|--------|--------|
| Found neither dusk nor dawn | 0 |
| Found dusk OR dawn | 1 |
| Found BOTH dusk AND dawn | 3 |

**NOT speed-based** — everyone has same time, simultaneous reveal.

### Real-time Updates (via Convex)
- Room state changes broadcast to all participants
- Player join/leave events
- "Player submitted" indicator (without revealing answer)
- Timer sync
- Simultaneous answer reveal

### Anti-Cheat Considerations
- Server validates puzzle solutions
- Server-side timer (don't trust client time)
- Answers stored server-side until reveal
- Rate limit solution submissions

---

## UI/UX Notes

### Interactive Tutorial Flow
1. Show single card, explain format
2. Show 2 cards, demonstrate evaluation
3. Show 3 cards, let player try
4. Explain dusk/dawn concept
5. Full mini-puzzle (3 cards, easy)
6. Graduate to Easy mode

### Hint System Progression
Level 1: "The dusk solution starts with a card that has [operator]"
Level 2: "Try starting with [first card]"
Level 3: "The dusk solution is: [full answer]"

### Share Text Template
```
Zero Rush Daily #[day_number] 🌅

Easy: [status] [attempts] attempts
Medium: [status] [attempts] attempts
Hard: [status] [attempts] attempts

[emoji_summary]

Play at: [url]
```

---

## Security Notes

### Daily Puzzle Timing
- Even with seed-based generation, validate on server
- Clock manipulation could let users "preview" tomorrow's puzzle
- Consider: require server timestamp for daily completions?

### Multiplayer Fairness
- All puzzle logic runs server-side for competitive modes
- Client only handles UI and sends card arrangement
- Server validates and broadcasts results

---

## Future Considerations

### Potential Features (Post-MVP)
- Puzzle creator/editor
- Community puzzle sharing
- Seasonal events
- Achievement system
- League/ranking system

### Scalability
- Convex handles most scaling
- May need CDN for assets
- Consider edge caching for daily puzzles
