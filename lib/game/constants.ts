/**
 * Game constants and configuration for Zero Rush v2
 */

import type { Difficulty, DifficultyConfig, Operator, UserSettings } from '../types/game';

// =============================================================================
// Difficulty Configuration
// =============================================================================

/** Configuration for each difficulty level */
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    cards: 4,
    zeroGuarantee: true,
    hintsAvailable: true,
    description: 'For newcomers, casual play',
  },
  medium: {
    cards: 6,
    zeroGuarantee: true,
    hintsAvailable: true,
    description: 'Balanced challenge',
  },
  hard: {
    cards: 8,
    zeroGuarantee: false,
    hintsAvailable: true,
    description: 'For experienced players',
  },
  challenger: {
    cards: 10,
    zeroGuarantee: false,
    hintsAvailable: false,
    description: 'Must be unlocked; brutal',
  },
} as const;

/** Permutation counts for reference */
export const PERMUTATION_COUNTS: Record<number, number> = {
  4: 24,
  5: 120,
  6: 720,
  7: 5_040,
  8: 40_320,
  9: 362_880,
  10: 3_628_800,
} as const;

// =============================================================================
// Operator Configuration
// =============================================================================

/** All valid operators */
export const OPERATORS: readonly Operator[] = ['+', '-', '*', '÷'] as const;

/** Operator order for canonical sorting */
export const OPERATOR_ORDER: Record<Operator, number> = {
  '+': 0,
  '-': 1,
  '*': 2,
  '÷': 3,
} as const;

/** Display symbols for operators (for UI) */
export const OPERATOR_DISPLAY: Record<Operator, string> = {
  '+': '+',
  '-': '−', // minus sign (not hyphen)
  '*': '×',
  '÷': '÷',
} as const;

// =============================================================================
// Card Generation Ranges
// =============================================================================

/** Default number ranges for card generation */
export const DEFAULT_CARD_RANGES = {
  plus: { min: 1, max: 9 },
  minus: { min: 1, max: 9 },
  multiply: { min: 2, max: 9 },
  divide: { min: 2, max: 9 },
} as const;

/** Extended ranges (for harder puzzles) */
export const EXTENDED_CARD_RANGES = {
  plus: { min: 1, max: 18 },
  minus: { min: 1, max: 18 },
  multiply: { min: 2, max: 12 },
  divide: { min: 2, max: 12 },
} as const;

// =============================================================================
// Puzzle Quality Thresholds
// =============================================================================

/** 
 * A puzzle is "good" if the ratio of permutations to unique answers is <= this threshold.
 * Lower ratio means more unique answers relative to permutations.
 */
export const QUALITY_THRESHOLD = 5;

/** Maximum attempts before relaxing quality requirements */
export const MAX_GENERATION_ATTEMPTS = 100;

/** Relaxed threshold after MAX_GENERATION_ATTEMPTS */
export const RELAXED_QUALITY_THRESHOLD = 10;

// =============================================================================
// Game Limits
// =============================================================================

/** Maximum number of attempts per game */
export const MAX_ATTEMPTS = 10;

/** Maximum search history size (for back navigation) */
export const MAX_SEARCH_HISTORY = 4;

// =============================================================================
// Timing Configuration
// =============================================================================

/** Challenger unlock threshold (in milliseconds) */
export const CHALLENGER_UNLOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

/** Default multiplayer time limits (in minutes) */
export const MULTIPLAYER_TIME_LIMITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Default multiplayer round options */
export const MULTIPLAYER_ROUND_OPTIONS = [3, 5, 8, 10] as const;

/** Default multiplayer max players */
export const MULTIPLAYER_MAX_PLAYERS = [2, 3, 4, 5, 6, 7, 8] as const;

// =============================================================================
// Economy Configuration
// =============================================================================

/** Gems earned per streak milestone */
export const GEMS_PER_STREAK_MILESTONE = 10;

/** Streak milestone interval */
export const STREAK_MILESTONE_INTERVAL = 10;

/** Cost of a hint in gems */
export const HINT_COST = 5;

/** Cost of a streak save in gems */
export const STREAK_SAVE_COST = 10;

/** Cost of a skin in gems */
export const SKIN_COST = 10;

// =============================================================================
// Multiplayer Scoring
// =============================================================================

/** Points for finding neither target */
export const POINTS_NEITHER = 0;

/** Points for finding one target (dusk OR dawn) */
export const POINTS_ONE = 1;

/** Points for finding both targets */
export const POINTS_BOTH = 3;

// =============================================================================
// Default Settings
// =============================================================================

/** Default user settings */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  zeroGuarantee: {
    easy: true,
    medium: true,
    hard: false,
  },
  soundEffects: true,
  hapticFeedback: true,
  theme: 'system',
  relockChallenger: 'never',
} as const;

// =============================================================================
// UI Colors
// =============================================================================

/** Color tokens for dusk/dawn theming */
export const GAME_COLORS = {
  dark: {
    dusk: '#38bdf8', // Sky-400
    dawn: '#fbbf24', // Amber-400
    background: '#0f172a', // Slate-900
    surface: '#1e293b', // Slate-800
  },
  light: {
    dusk: '#1d4ed8', // Blue-700
    dawn: '#d97706', // Amber-600
    background: '#f8fafc', // Slate-50
    surface: '#ffffff',
  },
} as const;

/** Quality indicator colors */
export const QUALITY_COLORS = {
  perfect: { border: 'green', background: 'green' },
  hasZero: { border: 'green', background: 'purple' },
  isGood: { border: 'purple', background: 'green' },
  playable: { border: 'yellow', background: 'purple' },
  invalid: { border: 'red', background: 'red' },
} as const;
