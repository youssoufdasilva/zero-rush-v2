# Design Decisions Log

> Tracking decisions made during the design phase. Each entry includes context, decision, and rationale.

---

## Decided ✅

### D001: Evaluation Order
**Decision**: Left-to-right evaluation (no PEMDAS)  
**Rationale**: Makes mental math tractable without pen & paper. Creates unique puzzle patterns.  
**Date**: Original design (v1)

### D002: Dual Target Mechanic
**Decision**: Players must find BOTH lowest (dusk) AND highest (dawn)  
**Rationale**: Adds strategic depth. Can't just optimize for one target.  
**Date**: Original design (v1)

### D002b: Terminology Change
**Decision**: Rename "sunset/sunrise" to "dusk/dawn"  
**Rationale**: Shorter, equally evocative, works for potential "Dusk & Dawn" game name.  
**Date**: Jan 2026

### D003: Daily Puzzle Structure
**Decision**: One puzzle per difficulty level (Easy, Medium, Hard)  
**Rationale**: Lets players engage at their comfort level. Provides 3 daily challenges.  
**Date**: Jan 2026

### D004: Daily Reset Timing
**Decision**: UTC midnight (displayed as "GMT" to users)  
**Rationale**: Single global reset is simpler than timezone-aware. GMT is more user-friendly terminology.  
**Date**: Jan 2026

### D005: Canonical Puzzle Signature
**Decision**: Sort by operator (+, -, *, ÷) then by number (numerically)  
**Rationale**: Bijective mapping allows deduplication and sharing. Operator order chosen arbitrarily but consistently.  
**Date**: Jan 2026

### D006: Challenger Unlock Mechanism
**Decision**: Complete Timed Hard Mode in under 5 minutes  
**Rationale**: Proves player capability. Threshold TBD based on real data.  
**Date**: Jan 2026

### D007: Challenger Zero Guarantee
**Decision**: Challenger mode has NO zero guarantee  
**Rationale**: Removes "zero hunting" shortcut. Maximum difficulty.  
**Date**: Jan 2026

### D008: Re-lock Challenger Setting
**Decision**: Optional, configurable re-lock timer (default: never)  
**Rationale**: Some players want to "stay sharp" for hardest content. Optional respects casual players.  
**Date**: Jan 2026

### D009: Timed Mode Philosophy
**Decision**: Reward efficiency, not pressure (except for Challenger unlock)  
**Rationale**: Math games shouldn't feel stressful. Speed rewards are positive, not punitive.  
**Date**: Jan 2026

### D010: Share Format Preference
**Decision**: Text sharing preferred, image optional  
**Rationale**: Text is more accessible (works everywhere), smaller, easier to generate.  
**Date**: Jan 2026

### D011: Settings Philosophy
**Decision**: Configure once, then hide from main UI  
**Rationale**: Reduces cognitive load during gameplay. Players shouldn't think about settings mid-game.  
**Date**: Jan 2026

### D012: PWA with Offline Support
**Decision**: Basic single-player mode playable offline, sync on reconnect  
**Rationale**: Mobile-first experience. Subway/airplane use cases.  
**Date**: Jan 2026

### D013: Game Name
**Decision**: Keep "Zero Rush" for now, document "Dusk & Dawn" as potential rename  
**Rationale**: Zero in name signals approachability during testing. May change if zero-mode becomes less central.  
**Date**: Jan 2026

### D014: PWA Sync Scope
**Decision**: Sync everything (games, settings, starred puzzles, Challenger progress)  
**Rationale**: No reason to limit sync. Better UX to have complete state sync.  
**Date**: Jan 2026

### D015: Daily Puzzle Offline
**Decision**: Daily puzzles do NOT work offline  
**Rationale**: Treat as multiplayer mode. Prevents clock manipulation cheating. Users can play past dailies or random puzzles offline.  
**Date**: Jan 2026

### D016: User Authentication
**Decision**: OAuth via Convex  
**Rationale**: Convex provides built-in OAuth. Persistent identity without building auth from scratch.  
**Date**: Jan 2026

### D017: Multiplayer Scoring
**Decision**: 0 pts (neither), 1 pt (one target), 3 pts (both targets). NOT speed-based.  
**Rationale**: Everyone thinks privately, then simultaneous reveal. Rewards completeness over partial. 3x multiplier for finding both incentivizes thoroughness.  
**Date**: Jan 2026

### D018: Zero Mode Difficulty Ramp
**Decision**: On (Easy), On (Medium), Off (Hard), Off (Challenger). Configurable per player.  
**Rationale**: Natural progression teaches players to eventually play without zero-hunting. Configurable respects player preferences.  
**Date**: Jan 2026

### D019: In-Game Currency System
**Decision**: 💎 gems earned every 10 streaks. Spent on hints, skins, streak saves.  
**Rationale**: Adds progression/reward loop. Monetization potential for whales.  
**Date**: Jan 2026

### D020: Streak Tracking
**Decision**: Combined across all difficulties (not per-difficulty). Lost streaks shown as motivational.  
**Rationale**: Simpler for players. One number to track.  
**Date**: Jan 2026

### D021: Streak Save Mechanic
**Decision**: Players can spend 💎 to save a streak, but only if they missed exactly one day.  
**Rationale**: Prevents abuse while giving second chances. Option doesn't even appear for multi-day misses.  
**Date**: Jan 2026

### D022: Hint Cost
**Decision**: Hints cost 💎 (not just affect stats/streaks).  
**Rationale**: Creates meaningful tradeoff. Players earn hints through engagement.  
**Date**: Jan 2026

### D023: Multiplayer Round Structure
**Decision**: Best of max rounds configured in room settings (3, 5, 8, or 10).  
**Rationale**: Host controls session length. Clear endpoint.  
**Date**: Jan 2026

### D024: Onboarding Flow
**Decision**: Interactive tutorial first, then text explanation available.  
**Rationale**: Interactive is more engaging for first-time players. Text available for reference.  
**Date**: Jan 2026

### D025: Tech Stack - Hosting
**Decision**: Vercel (frontend) + Convex (backend/database)  
**Rationale**: Vercel pairs well with React PWA. Convex handles realtime + auth.  
**Date**: Jan 2026

### D026: Tech Stack - Analytics
**Decision**: PostHog for user tracking  
**Rationale**: Open-source, self-hostable option. Good for A/B testing.  
**Date**: Jan 2026

### D027: Player Puzzle Submissions
**Decision**: Players can submit puzzles for future dailies. Get cited if accepted, may earn 💎.  
**Rationale**: Community engagement. Crowdsourced quality puzzles. (Details TBD)  
**Date**: Jan 2026

### D028: Streak Save Limit
**Decision**: Unlimited saves allowed (costs 💎 each time), but with transparency.  
**Display format**: "🔥 127 day streak (2 saves)"  
**Rationale**: Let players (especially whales) spend gems however they want. Transparency preserves achievement integrity. Pure streaks (0 saves) remain a flex.  
**Date**: Jan 2026

### D029: Package Manager
**Decision**: Use `bun` instead of npm (`bun --bun` for runtime)  
**Rationale**: Faster installs, faster runtime, modern tooling.  
**Date**: Jan 2026

### D030: UI Theme Direction
**Decision**: Dark mode primary, using shadcn/ui with amber theme.  
**Component library**: shadcn/ui (Nova style, gray base, amber theme, Raleway font, Hugeicons)  
**Accent colors (dark mode)**:
- Dusk 🔵: Sky-400 (`#38bdf8`) — bright blue visible on dark
- Dawn 🟡: Amber-400 (`#fbbf24`) — golden, matches shadcn amber theme  
**Accent colors (light mode)**:
- Dusk 🔵: Blue-700 (`#1d4ed8`) — deep blue
- Dawn 🟡: Amber-600 (`#d97706`) — rich gold  
**Rationale**: Dark mode is user preference. Amber theme naturally supports dawn. Adjusted dusk blue to not clash with slate background.  
**Date**: Jan 2026

### D031: Component Library
**Decision**: shadcn/ui with specific config  
**Setup URL**: `https://ui.shadcn.com/create?iconLibrary=hugeicons&base=base&style=nova&baseColor=gray&theme=amber&font=raleway&menuAccent=bold`  
**Rationale**: Pre-built accessible components, great dark/light mode support, customizable.  
**Date**: Jan 2026

### D032: Easy Mode Card Count
**Decision**: 4 cards (24 permutations)  
**Rationale**: Simpler for beginners. 5 cards (120 permutations) felt too similar to Medium difficulty.  
**Date**: Jan 2026

### D033: Card Rendering
**Decision**: Text-based cards (no images)
**Rationale**: Simpler to implement, more accessible, works better across themes.
**Date**: Jan 2026

### D034: Settings System
**Decision**: 9 configurable options persisted to localStorage under `zero-rush-settings`
**Options**: showTargetValues, highlightMatches, autoSubmit, soundEffects, clearAfterSubmit, controlsStyle, historyPlacement, cardScaling, maxHistoryLength
**Rationale**: Offline-first approach. No backend needed for settings. Immediate persistence on change.
**Date**: Jan 2026

### D035: Sound Effects Implementation
**Decision**: Web Audio API with lazy AudioContext creation, client-only
**10 sound types**: cardAdd, cardRemove, submitValid, submitInvalid, duplicate, duskFound, dawnFound, puzzleComplete, clear, newPuzzle
**Rationale**: No asset files needed. SSR-safe. Customizable frequencies and durations. Multi-step tones for important events.
**Date**: Jan 2026

### D036: Submission History
**Decision**: Track submissions with signature-based duplicate detection. Flash feedback on duplicates.
**Display options**: Inline (below board) or drawer (side panel) via settings
**Rationale**: Prevents wasted attempts on duplicate arrangements. Visual feedback helps player learn.
**Date**: Jan 2026

### D037: Mobile Drag-and-Drop
**Decision**: `@dnd-kit` with TouchSensor (150ms activation delay) + PointerSensor
**Rationale**: 150ms delay prevents accidental drags during scrolling. dnd-kit provides accessible, performant drag-and-drop.
**Date**: Jan 2026

### D038: Card Scaling for 8+ Cards
**Decision**: Three modes configurable in settings: auto (detect device), scale (shrink cards), scroll (horizontal overflow)
**Auto behavior**: Scroll on touch devices, scale on desktop
**Rationale**: Mobile screens benefit from scrolling (easier tap targets). Desktop has room to scale.
**Date**: Jan 2026

---

## Pending ❓

### P002: Odd-Number Card Progression
**Options**: Current (4-6-8-10) vs odd-only (5-7-9-11)  
**Considerations**: Odd numbers might feel more distinct. 11 cards = 39.9M perms (performance concern)  
**Status**: Needs A/B testing

### P003: Share Format Design
**Question**: How to make sharing unique vs Wordle clones?  
**Status**: Design needed

### P004: Player Submission Rewards
**Question**: Should accepted puzzle submissions earn 💎? How much?  
**Considerations**: Incentivizes submissions but could be gamed  
**Status**: TBD

---

## Rejected ❌

### R001: PEMDAS Evaluation
**Rejected because**: Too difficult for mental math. Loses unique game identity.

### R002: Single Daily Puzzle (One Difficulty)
**Rejected because**: Limits player engagement. Not everyone wants Hard daily.

### R003: Image-Only Sharing
**Rejected because**: Less accessible, harder to generate, larger file size.

### R004: 5 Cards for Easy Mode
**Rejected because**: 120 permutations too close to Medium. 4 cards (24 perms) provides clearer differentiation.
