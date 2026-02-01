/**
 * Zero Rush v2 - Game Logic Module
 * 
 * Re-exports all game-related functionality for convenient imports.
 * 
 * @example
 * import { evaluate, generatePuzzle, toCanonicalSignature } from '@/lib/game';
 */

// Types
export type {
  Card,
  CardString,
  Difficulty,
  DifficultyConfig,
  EvaluationResult,
  GameMode,
  GameRecord,
  Operator,
  Puzzle,
  PuzzleQuality,
  PuzzleResult,
  RoomConfig,
  RoomState,
  Target,
  UserProfile,
  UserSettings,
  UserStats,
  ZeroMode,
} from '../types/game';

// Type utilities
export { getPuzzleQuality } from '../types/game';

// Constants
export {
  CHALLENGER_UNLOCK_TIME_MS,
  DEFAULT_CARD_RANGES,
  DEFAULT_USER_SETTINGS,
  DIFFICULTY_CONFIG,
  EXTENDED_CARD_RANGES,
  GAME_COLORS,
  GEMS_PER_STREAK_MILESTONE,
  HINT_COST,
  MAX_ATTEMPTS,
  MAX_GENERATION_ATTEMPTS,
  MAX_SEARCH_HISTORY,
  MULTIPLAYER_MAX_PLAYERS,
  MULTIPLAYER_ROUND_OPTIONS,
  MULTIPLAYER_TIME_LIMITS,
  OPERATOR_DISPLAY,
  OPERATOR_ORDER,
  OPERATORS,
  PERMUTATION_COUNTS,
  POINTS_BOTH,
  POINTS_NEITHER,
  POINTS_ONE,
  QUALITY_COLORS,
  QUALITY_THRESHOLD,
  RELAXED_QUALITY_THRESHOLD,
  SKIN_COST,
  STREAK_MILESTONE_INTERVAL,
  STREAK_SAVE_COST,
} from './constants';

// Evaluation
export {
  cardToString,
  cardsToStrings,
  evaluate,
  evaluateFromStrings,
  formatCardForDisplay,
  getEvaluationDisplay,
  isValidAnswer,
  isValidOperator,
  isValidResult,
  parseCard,
  parseCards,
} from './evaluate';

// Generation
export {
  createPuzzle,
  findGoodPuzzle,
  findGoodPuzzleForDifficulty,
  generateAnswers,
  generateCompletePuzzle,
  generatePuzzle,
  generatePuzzleForDifficulty,
  permute,
  permutePuzzle,
} from './generate';

// Signatures
export {
  compareCards,
  compareCardStrings,
  decodeSignatureFromUrl,
  encodeSignatureForUrl,
  fromSignature,
  isValidSignature,
  normalizeSignature,
  puzzlesAreEquivalent,
  signatureFromStrings,
  signatureToDisplay,
  signatureToShortHash,
  signatureToStrings,
  signaturesAreEqual,
  toCanonicalSignature,
} from './signature';
