/**
 * Puzzle generation logic for Zero Rush v2
 * 
 * Ported from v1 GameHelpers.js with TypeScript types.
 * 
 * Key functions:
 * - generatePuzzle: Creates a random hand of cards
 * - generateAnswers: Analyzes all permutations to find dusk/dawn
 * - findGoodPuzzle: Keeps generating until a quality puzzle is found
 */

import type { 
  Card, 
  Difficulty, 
  Operator, 
  Puzzle, 
  PuzzleResult, 
  Target 
} from '../types/game';
import { evaluate, isValidAnswer } from './evaluate';
import { toCanonicalSignature } from './signature';
import { 
  DIFFICULTY_CONFIG, 
  DEFAULT_CARD_RANGES,
  QUALITY_THRESHOLD,
  MAX_GENERATION_ATTEMPTS,
  RELAXED_QUALITY_THRESHOLD,
} from './constants';

// =============================================================================
// Card Generation
// =============================================================================

interface CardRange {
  min: number;
  max: number;
}

interface CardRanges {
  plus: CardRange;
  minus: CardRange;
  multiply: CardRange;
  divide: CardRange;
}

/**
 * Generate all possible cards for a given operator and range
 */
function generateCardsForOperator(operator: Operator, range: CardRange): Card[] {
  const cards: Card[] = [];
  for (let value = range.min; value <= range.max; value++) {
    cards.push({ operator, value });
  }
  return cards;
}

/**
 * Generate the full deck of available cards
 */
function generateDeck(ranges: CardRanges = DEFAULT_CARD_RANGES): Card[] {
  return [
    ...generateCardsForOperator('+', ranges.plus),
    ...generateCardsForOperator('-', ranges.minus),
    ...generateCardsForOperator('*', ranges.multiply),
    ...generateCardsForOperator('÷', ranges.divide),
  ];
}

/**
 * Generate a random puzzle (hand of cards)
 * 
 * @param cardCount - Number of cards to deal
 * @param ranges - Number ranges for each operator type
 * @returns Array of cards (without replacement from deck)
 */
export function generatePuzzle(
  cardCount: number = 6,
  ranges: CardRanges = DEFAULT_CARD_RANGES
): Card[] {
  const deck = generateDeck(ranges);
  const hand: Card[] = [];
  
  // Draw cards without replacement
  for (let i = 0; i < cardCount && deck.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    hand.push(deck[randomIndex]);
    deck.splice(randomIndex, 1);
  }
  
  return hand;
}

/**
 * Generate a puzzle for a specific difficulty level
 */
export function generatePuzzleForDifficulty(difficulty: Difficulty): Card[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  return generatePuzzle(config.cards);
}

// =============================================================================
// Permutation Generation
// =============================================================================

/**
 * Generate all permutations of an array
 * 
 * Uses Heap's algorithm for efficiency.
 * Warning: n! grows very fast!
 * - 4 cards: 24 permutations
 * - 6 cards: 720 permutations
 * - 8 cards: 40,320 permutations
 * - 10 cards: 3,628,800 permutations
 */
export function permute<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  const working = [...arr];
  
  function heapPermute(n: number): void {
    if (n === 1) {
      result.push([...working]);
      return;
    }
    
    for (let i = 0; i < n; i++) {
      heapPermute(n - 1);
      
      // Swap based on whether n is even or odd
      if (n % 2 === 0) {
        [working[i], working[n - 1]] = [working[n - 1], working[i]];
      } else {
        [working[0], working[n - 1]] = [working[n - 1], working[0]];
      }
    }
  }
  
  heapPermute(working.length);
  return result;
}

/**
 * Generate all permutations of a puzzle's cards
 */
export function permutePuzzle(cards: Card[]): Card[][] {
  return permute(cards);
}

// =============================================================================
// Puzzle Analysis
// =============================================================================

/** Max cards before switching to sampled evaluation */
const EXHAUSTIVE_THRESHOLD = 6;

/** Number of random samples for larger puzzles */
const SAMPLE_SIZE = 5000;

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate random permutation samples
 */
function generateSampledPermutations(cards: Card[], sampleSize: number): Card[][] {
  const samples: Card[][] = [];
  const seen = new Set<string>();
  
  // Generate unique random shuffles
  for (let i = 0; i < sampleSize * 2 && samples.length < sampleSize; i++) {
    const shuffled = shuffle(cards);
    const key = shuffled.map(c => `${c.operator}${c.value}`).join(',');
    
    if (!seen.has(key)) {
      seen.add(key);
      samples.push(shuffled);
    }
  }
  
  return samples;
}

/**
 * Analyze permutations of a puzzle to find dusk and dawn targets.
 * Uses exhaustive search for small puzzles, sampling for large ones.
 * 
 * @param cards - The puzzle cards to analyze
 * @returns PuzzleResult with dusk (lowest) and dawn (highest) targets
 */
export function generateAnswers(cards: Card[]): PuzzleResult {
  if (cards.length === 0) {
    return createInvalidResult();
  }
  
  // Use exhaustive search for small puzzles, sampling for large ones
  const useExhaustive = cards.length <= EXHAUSTIVE_THRESHOLD;
  const permutations = useExhaustive 
    ? permutePuzzle(cards) 
    : generateSampledPermutations(cards, SAMPLE_SIZE);
  
  // Map from answer value to { arrangement, count, floatDetected }
  const answerMap = new Map<number, {
    arrangement: Card[];
    count: number;
    floatDetected: boolean;
  }>();
  
  // Evaluate all permutations
  for (const arrangement of permutations) {
    const result = evaluate(arrangement);
    
    // Only count valid positive whole numbers (including 0)
    if (isValidAnswer(result.answer)) {
      const existing = answerMap.get(result.answer);
      
      if (existing) {
        existing.count++;
      } else {
        answerMap.set(result.answer, {
          arrangement: [...arrangement],
          count: 1,
          floatDetected: result.floatDetected,
        });
      }
    }
  }
  
  // Need at least 2 unique valid answers
  if (answerMap.size < 2) {
    return createInvalidResult();
  }
  
  // Get sorted answer values
  const sortedAnswers = Array.from(answerMap.keys()).sort((a, b) => a - b);
  
  const lowestValue = sortedAnswers[0];
  const highestValue = sortedAnswers[sortedAnswers.length - 1];
  
  const lowestData = answerMap.get(lowestValue)!;
  const highestData = answerMap.get(highestValue)!;
  
  // Create targets
  const dusk: Target = {
    result: lowestValue,
    arrangement: lowestData.arrangement,
    permutationCount: lowestData.count,
    floatDetected: lowestData.floatDetected,
  };
  
  const dawn: Target = {
    result: highestValue,
    arrangement: highestData.arrangement,
    permutationCount: highestData.count,
    floatDetected: highestData.floatDetected,
  };
  
  // Quality metrics
  const hasZero = lowestValue === 0;
  // For sampled results, we can't know if dawn is truly unique
  const isGood = useExhaustive ? highestData.count === 1 : true;
  
  return {
    hasValidAnswers: true,
    isGood,
    hasZero,
    totalPermutations: permutations.length,
    uniqueAnswers: answerMap.size,
    dusk,
    dawn,
  };
}

/**
 * Create an invalid puzzle result
 */
function createInvalidResult(): PuzzleResult {
  const emptyTarget: Target = {
    result: 0,
    arrangement: [],
    permutationCount: 0,
    floatDetected: false,
  };
  
  return {
    hasValidAnswers: false,
    isGood: false,
    hasZero: false,
    totalPermutations: 0,
    uniqueAnswers: 0,
    dusk: emptyTarget,
    dawn: emptyTarget,
  };
}

// =============================================================================
// Quality Puzzle Generation
// =============================================================================

interface FindGoodPuzzleOptions {
  cardCount?: number;
  requireZero?: boolean;
  requireGood?: boolean;
  maxAttempts?: number;
  ranges?: CardRanges;
}

interface FindGoodPuzzleResult {
  puzzle: Card[];
  result: PuzzleResult;
  attempts: number;
  relaxedQuality: boolean;
}

/**
 * Keep generating puzzles until a "good" one is found
 * 
 * A good puzzle has:
 * - At least 2 valid answers
 * - (Optional) hasZero: lowest value is 0
 * - (Optional) isGood: unique dawn solution
 * - Reasonable permutation/answer ratio
 * 
 * @param options - Generation options
 * @returns The puzzle and its analysis result
 */
export function findGoodPuzzle(options: FindGoodPuzzleOptions = {}): FindGoodPuzzleResult {
  const {
    cardCount = 6,
    requireZero = true,
    requireGood = true,
    maxAttempts = MAX_GENERATION_ATTEMPTS,
    ranges = DEFAULT_CARD_RANGES,
  } = options;
  
  let attempts = 0;
  let threshold = QUALITY_THRESHOLD;
  let relaxedQuality = false;
  
  while (attempts < maxAttempts * 2) { // Allow up to 2x attempts with relaxed quality
    attempts++;
    
    // Relax quality threshold after maxAttempts
    if (attempts > maxAttempts && !relaxedQuality) {
      threshold = RELAXED_QUALITY_THRESHOLD;
      relaxedQuality = true;
    }
    
    const puzzle = generatePuzzle(cardCount, ranges);
    const result = generateAnswers(puzzle);
    
    // Skip invalid puzzles
    if (!result.hasValidAnswers) continue;
    
    // Check quality ratio
    const qualityRatio = result.totalPermutations / result.uniqueAnswers;
    const meetsQuality = qualityRatio <= threshold;
    
    if (!meetsQuality) continue;
    
    // Check zero requirement
    if (requireZero && !result.hasZero) continue;
    
    // Check good requirement (can be relaxed if we're past maxAttempts)
    if (requireGood && !result.isGood && !relaxedQuality) continue;
    
    // Found a suitable puzzle!
    return {
      puzzle,
      result,
      attempts,
      relaxedQuality,
    };
  }
  
  // Fallback: return any valid puzzle
  const puzzle = generatePuzzle(cardCount, ranges);
  const result = generateAnswers(puzzle);
  
  return {
    puzzle,
    result,
    attempts,
    relaxedQuality: true,
  };
}

/**
 * Find a good puzzle for a specific difficulty level
 */
export function findGoodPuzzleForDifficulty(difficulty: Difficulty): FindGoodPuzzleResult {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  return findGoodPuzzle({
    cardCount: config.cards,
    requireZero: config.zeroGuarantee,
    requireGood: true,
  });
}

// =============================================================================
// Puzzle Creation Helpers
// =============================================================================

/**
 * Create a full Puzzle object with cards, signature, and difficulty
 */
export function createPuzzle(cards: Card[], difficulty: Difficulty): Puzzle {
  return {
    cards,
    signature: toCanonicalSignature(cards),
    difficulty,
  };
}

/**
 * Generate a complete puzzle with analysis for a difficulty level
 */
export function generateCompletePuzzle(difficulty: Difficulty): {
  puzzle: Puzzle;
  result: PuzzleResult;
} {
  const { puzzle: cards, result } = findGoodPuzzleForDifficulty(difficulty);
  const puzzle = createPuzzle(cards, difficulty);
  
  return { puzzle, result };
}
