/**
 * Core game type definitions for Zero Rush v2
 */

// =============================================================================
// Card Types
// =============================================================================

/** Valid operators for cards */
export type Operator = "+" | "-" | "*" | "÷";

/** A single card with an operator and value */
export interface Card {
  operator: Operator;
  value: number;
}

/** String representation of a card (e.g., "+3", "÷4") */
export type CardString = `${Operator}${number}`;

/** A slot that can contain a card or be empty */
export type Slot = Card | null;

/** Auto-organization mode for hand/table zones */
export type AutoOrgMode = "off" | "hand" | "table" | "both";

/** Hint display mode */
export type HintMode = "disabled" | "directions" | "reveals";

/** Maximum hint limit setting */
export type MaxHintLimit = "half" | "all";

/** State for solution reveals/hints */
export interface HintState {
  /** Revealed cards for dusk solution */
  dusk: Card[];
  /** Revealed cards for dawn solution */
  dawn: Card[];
  /** Currently active target being hinted (null = no active hints displayed) */
  activeTarget: "dusk" | "dawn" | null;
}

/** A hinted card with its position in the solution */
export interface HintedCard {
  card: Card;
  position: number;
  theme: "dusk" | "dawn";
}

// =============================================================================
// Puzzle Types
// =============================================================================

/** Target solution (dusk or dawn) */
export interface Target {
  /** The result value */
  result: number;
  /** The card arrangement that produces this result */
  arrangement: Card[];
  /** Number of permutations that achieve this result */
  permutationCount: number;
  /** Whether a float was detected during calculation (intermediate step) */
  floatDetected: boolean;
}

/** Result of evaluating a single arrangement */
export interface EvaluationResult {
  /** The final answer */
  answer: number;
  /** Raw answer before rounding */
  rawAnswer: number;
  /** Whether a float was detected during calculation */
  floatDetected: boolean;
  /** The arrangement that was evaluated */
  arrangement: Card[];
}

/** Complete puzzle analysis result */
export interface PuzzleResult {
  /** Whether this puzzle has at least 2 valid answers */
  hasValidAnswers: boolean;
  /** Whether this is a "good" puzzle (unique dawn solution) */
  isGood: boolean;
  /** Whether the lowest answer is exactly 0 */
  hasZero: boolean;
  /** Total number of permutations */
  totalPermutations: number;
  /** Number of unique valid answers */
  uniqueAnswers: number;
  /** The dusk target (lowest positive whole number) */
  dusk: Target;
  /** The dawn target (highest positive whole number) */
  dawn: Target;
}

/** A puzzle with its cards and signature */
export interface Puzzle {
  /** The cards in this puzzle */
  cards: Card[];
  /** Canonical signature for deduplication */
  signature: string;
  /** Difficulty level this puzzle is suitable for */
  difficulty: Difficulty;
}

// =============================================================================
// Difficulty Types
// =============================================================================

/** Available difficulty levels */
export type Difficulty = "easy" | "medium" | "hard" | "challenger";

/** Configuration for a difficulty level */
export interface DifficultyConfig {
  /** Number of cards dealt */
  cards: number;
  /** Whether zero is guaranteed to be achievable */
  zeroGuarantee: boolean;
  /** Whether hints are available */
  hintsAvailable: boolean;
  /** Description for UI */
  description: string;
}

// =============================================================================
// Game Mode Types
// =============================================================================

/** Available game modes */
export type GameMode = "daily" | "practice" | "multiplayer";

// =============================================================================
// Game Record Types (Analytics)
// =============================================================================

/** Record of a completed game for analytics */
export interface GameRecord {
  /** Unique game ID */
  id: string;
  /** User who played */
  userId: string;
  /** Canonical puzzle signature */
  puzzleSignature: string;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Game mode */
  mode: GameMode;

  /** When the game started */
  startedAt: number;
  /** When the game was completed */
  completedAt: number;
  /** Duration in milliseconds */
  durationMs: number;

  /** Number of attempts made */
  attempts: number;
  /** Number of hints used */
  hintsUsed: number;
  /** When dusk was found (if at all) */
  duskFoundAt?: number;
  /** When dawn was found (if at all) */
  dawnFoundAt?: number;

  /** Whether the player found dusk */
  foundDusk: boolean;
  /** Whether the player found dawn */
  foundDawn: boolean;
  /** Whether the player completed the puzzle (found both) */
  completed: boolean;

  /** Game settings at time of play */
  settings: {
    zeroGuarantee: boolean;
  };

  /** A/B testing information */
  experimentGroup?: string;
  experimentVariant?: string;
}

// =============================================================================
// Quality Indicator Types
// =============================================================================

/** Quality classification for puzzle UI */
export type PuzzleQuality =
  | "perfect"
  | "hasZero"
  | "isGood"
  | "playable"
  | "invalid";

/** Get quality classification from puzzle result */
export function getPuzzleQuality(result: PuzzleResult): PuzzleQuality {
  if (!result.hasValidAnswers) return "invalid";
  if (result.hasZero && result.isGood) return "perfect";
  if (result.hasZero) return "hasZero";
  if (result.isGood) return "isGood";
  return "playable";
}

// =============================================================================
// Multiplayer Types
// =============================================================================

/** Room state in multiplayer */
export type RoomState =
  | "waiting"
  | "starting"
  | "thinking"
  | "reveal"
  | "scoring"
  | "finished";

/** Zero mode setting */
export type ZeroMode = "guaranteed" | "open";

/** Room visibility */
export type RoomVisibility = "private" | "public";

/** Multiplayer room configuration */
export interface RoomConfig {
  handSize: 4 | 5 | 6 | 7 | 8 | 9 | 10;
  timeLimitMinutes: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  zeroMode: ZeroMode;
  visibility: RoomVisibility;
  maxPlayers: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  maxRounds: 3 | 5 | 8 | 10;
}

/** Player's answer submission in multiplayer */
export interface PlayerSubmission {
  playerId: string;
  duskArrangement?: Card[];
  dawnArrangement?: Card[];
  submittedAt: number;
}

/** Multiplayer scoring result */
export interface RoundScore {
  playerId: string;
  foundDusk: boolean;
  foundDawn: boolean;
  points: 0 | 1 | 3;
}

// =============================================================================
// User Types
// =============================================================================

/** User profile and stats */
export interface UserProfile {
  id: string;
  displayName: string;
  createdAt: number;

  /** Settings */
  settings: UserSettings;

  /** Stats */
  stats: UserStats;

  /** Currency */
  gemBalance: number;

  /** Streaks */
  currentStreak: number;
  longestStreak: number;
  streakSavesUsed: number;
  lastDailyCompletedAt?: number;

  /** Challenger unlock */
  challengerUnlocked: boolean;
  challengerUnlockedAt?: number;
}

/** User settings */
export interface UserSettings {
  zeroGuarantee: {
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
  soundEffects: boolean;
  hapticFeedback: boolean;
  theme: "light" | "dark" | "system";
  relockChallenger: "never" | "1h" | "1d" | "3d" | "1w" | "2w";
}

/** User statistics */
export interface UserStats {
  totalGamesPlayed: number;
  gamesPerDifficulty: Record<Difficulty, number>;
  winRate: Record<Difficulty, number>;
  averageSolveTime: Record<Difficulty, number>;
  bestTimes: Record<Difficulty, number>;
  puzzlesStarred: number;
}

// =============================================================================
// Transaction Types
// =============================================================================

/** Reason for earning/spending gems */
export type TransactionReason =
  | "streak_milestone"
  | "puzzle_submission"
  | "hint"
  | "skin"
  | "streak_save"
  | "purchase";

/** Gem transaction record */
export interface Transaction {
  id: string;
  userId: string;
  type: "earn" | "spend";
  amount: number;
  reason: TransactionReason;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

// =============================================================================
// Daily Puzzle Types
// =============================================================================

// =============================================================================
// Puzzle Sharing & History Types
// =============================================================================

/** Share message preset types */
export type SharePreset = "challenge" | "teaser" | "wordle";

/** Hints used during a puzzle session */
export interface HintsUsed {
  dusk: number;
  dawn: number;
  total: number;
}

/** A submission stored in puzzle history */
export interface HistorySubmission {
  /** The card arrangement that was submitted */
  arrangement: Card[];
  /** The evaluated result */
  result: number;
  /** Whether this matched dusk */
  isDusk: boolean;
  /** Whether this matched dawn */
  isDawn: boolean;
}

/** An entry in the puzzle history */
export interface PuzzleHistoryEntry {
  /** Unique ID for this entry */
  id: string;
  /** The cards in this puzzle */
  cards: Card[];
  /** Canonical signature for the puzzle */
  signature: string;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Number of attempts taken */
  attempts: number;
  /** Submissions that found dusk/dawn */
  submissions: HistorySubmission[];
  /** When the puzzle was completed */
  completedAt: number;
  /** The dusk value (lowest) */
  duskValue: number;
  /** The dawn value (highest) */
  dawnValue: number;
  /** Whether dusk was found */
  foundDusk: boolean;
  /** Whether dawn was found */
  foundDawn: boolean;
  /** Whether this puzzle is favorited */
  isFavorite: boolean;
  /** Source of the puzzle */
  source: "generated" | "shared";
  /** Original URL if puzzle was shared */
  sharedFromUrl?: string;
  /** Hints used during this puzzle */
  hintsUsed?: HintsUsed;
}

// =============================================================================
// Daily Puzzle Types
// =============================================================================

/** Daily puzzle entry */
export interface DailyPuzzle {
  id: string;
  date: string; // YYYY-MM-DD
  difficulty: Difficulty;
  puzzleSignature: string;
  cards: Card[];

  /** Pre-calculated answers for validation */
  duskValue: number;
  dawnValue: number;

  /** Quality metrics */
  hasZero: boolean;
  isGood: boolean;

  /** Optional attribution */
  submittedBy?: string;
}

/** Player's daily puzzle completion */
export interface DailyCompletion {
  id: string;
  userId: string;
  date: string;
  difficulty: Difficulty;

  completed: boolean;
  attempts: number;
  hintsUsed: number;
  durationMs: number;

  completedAt?: number;
}
