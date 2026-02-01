 # Sound Effects (Client-Only)
 
 This document describes the current sound effects system for Zero Rush v2.
 
 ## Overview
 
 - Sound effects are generated via Web Audio (no external audio assets).
 - Sounds are client-only and do not require backend integration.
 - A Settings toggle controls whether sounds play.
 
 ## Where It Lives
 
 - Sound hook: `zero-rush-v2/lib/hooks/use-sound-effects.ts`
 - Settings toggle: `zero-rush-v2/components/game/settings-dialog.tsx`
 - Event wiring: `zero-rush-v2/components/game/game-board.tsx`
 
 ## Sound Map
 
 The hook exposes `play(name)`, where name is one of:
 
 - `cardAdd`: short tap when a card is added to the arrangement
 - `cardRemove`: lower tap when a card is removed
 - `submitValid`: confirmation tone for valid submit
 - `submitInvalid`: error tone for invalid submit (negative or non-integer)
 - `duplicate`: error tone for duplicate submit
 - `duskFound`: two-note chime when dusk is found
 - `dawnFound`: two-note chime when dawn is found
 - `puzzleComplete`: win sting when both targets are found
 - `clear`: light reset tone when arrangement is cleared
 - `newPuzzle`: light reset tone when a new puzzle is generated
 
 ## Settings
 
 `GameSettings` includes:
 
 - `soundEffects: boolean` (default `true`)
 
 This setting is persisted alongside other local settings.
 
 ## Notes
 
 - Web Audio contexts require user interaction in some browsers. Sounds should only be triggered in response to user actions or state transitions caused by those actions.
 - To adjust pitches/volumes, modify the `SOUND_MAP` in `use-sound-effects.ts`.
