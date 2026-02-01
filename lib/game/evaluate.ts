/**
 * Puzzle evaluation logic for Zero Rush v2
 * 
 * Ported from v1 GameHelpers.js with TypeScript types.
 * 
 * Key rules:
 * - Left-to-right evaluation (no PEMDAS/operator precedence)
 * - First card's operator is ignored (just uses the number)
 * - Only positive whole numbers count (0 allowed, negatives and decimals don't count)
 */

import type { Card, CardString, EvaluationResult, Operator } from '../types/game';

// =============================================================================
// Card Parsing
// =============================================================================

/**
 * Parse a card string (e.g., "+3", "÷4") into a Card object
 */
export function parseCard(cardString: CardString | string): Card {
  const operator = cardString.charAt(0) as Operator;
  const value = parseInt(cardString.substring(1), 10);
  
  if (!isValidOperator(operator)) {
    throw new Error(`Invalid operator: ${operator}`);
  }
  
  if (isNaN(value)) {
    throw new Error(`Invalid card value: ${cardString}`);
  }
  
  return { operator, value };
}

/**
 * Convert a Card object to its string representation
 */
export function cardToString(card: Card): CardString {
  return `${card.operator}${card.value}` as CardString;
}

/**
 * Check if a character is a valid operator
 */
export function isValidOperator(char: string): char is Operator {
  return char === '+' || char === '-' || char === '*' || char === '÷';
}

/**
 * Parse an array of card strings into Card objects
 */
export function parseCards(cardStrings: string[]): Card[] {
  return cardStrings.map(parseCard);
}

/**
 * Convert an array of Card objects to string representations
 */
export function cardsToStrings(cards: Card[]): CardString[] {
  return cards.map(cardToString);
}

// =============================================================================
// Puzzle Evaluation
// =============================================================================

/**
 * Evaluate a puzzle arrangement and return the result.
 * 
 * Rules:
 * - First card's operator is ignored (just the number)
 * - Subsequent cards apply their operator to the running total
 * - Evaluation is strictly left-to-right (no PEMDAS)
 * 
 * @param arrangement - Array of cards in the order to evaluate
 * @returns EvaluationResult with the answer and metadata
 * 
 * @example
 * // Evaluate: 9, +1, ÷2, -5
 * // → 9 → +1 = 10 → ÷2 = 5 → -5 = 0
 * evaluate([
 *   { operator: '+', value: 9 },
 *   { operator: '+', value: 1 },
 *   { operator: '÷', value: 2 },
 *   { operator: '-', value: 5 }
 * ]) // → { answer: 0, ... }
 */
export function evaluate(arrangement: Card[]): EvaluationResult {
  if (arrangement.length === 0) {
    return {
      answer: 0,
      rawAnswer: 0,
      floatDetected: false,
      arrangement: [],
    };
  }

  let result = arrangement[0].value; // First card's operator is ignored
  let floatDetected = false;

  for (let i = 1; i < arrangement.length; i++) {
    const card = arrangement[i];
    
    switch (card.operator) {
      case '+':
        result += card.value;
        break;
      case '-':
        result -= card.value;
        break;
      case '*':
        result *= card.value;
        break;
      case '÷':
        result /= card.value;
        break;
    }

    // Track if we ever had a non-integer intermediate result
    if (!Number.isInteger(result)) {
      floatDetected = true;
    }
  }

  // Round to handle floating point precision issues
  const roundedAnswer = Math.round((result + Number.EPSILON) * 100) / 100;

  return {
    answer: roundedAnswer,
    rawAnswer: result,
    floatDetected,
    arrangement,
  };
}

/**
 * Evaluate a puzzle from card strings
 * 
 * @example
 * evaluateFromStrings(['+9', '+1', '÷2', '-5']) // → { answer: 0, ... }
 */
export function evaluateFromStrings(cardStrings: string[]): EvaluationResult {
  const cards = parseCards(cardStrings);
  return evaluate(cards);
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if a result is a valid answer (positive whole number, including 0)
 */
export function isValidAnswer(answer: number): boolean {
  return answer >= 0 && Number.isInteger(answer);
}

/**
 * Check if an evaluation result is valid (positive whole number)
 */
export function isValidResult(result: EvaluationResult): boolean {
  return isValidAnswer(result.answer);
}

/**
 * Get the display string for an evaluation
 * Shows the calculation step by step
 * 
 * @example
 * getEvaluationDisplay([{ operator: '+', value: 9 }, { operator: '+', value: 1 }])
 * // → "9 → +1 = 10"
 */
export function getEvaluationDisplay(arrangement: Card[]): string {
  if (arrangement.length === 0) return '';
  
  const parts: string[] = [String(arrangement[0].value)];
  let result = arrangement[0].value;
  
  for (let i = 1; i < arrangement.length; i++) {
    const card = arrangement[i];
    
    switch (card.operator) {
      case '+':
        result += card.value;
        parts.push(`+${card.value}`);
        break;
      case '-':
        result -= card.value;
        parts.push(`-${card.value}`);
        break;
      case '*':
        result *= card.value;
        parts.push(`×${card.value}`);
        break;
      case '÷':
        result /= card.value;
        parts.push(`÷${card.value}`);
        break;
    }
    
    // Round for display
    const displayResult = Math.round((result + Number.EPSILON) * 100) / 100;
    parts.push(`= ${displayResult}`);
  }
  
  return parts.join(' → ');
}

/**
 * Format a card for display (using proper math symbols)
 */
export function formatCardForDisplay(card: Card, isFirst: boolean = false): string {
  const operatorDisplay: Record<Operator, string> = {
    '+': '+',
    '-': '−', // proper minus sign
    '*': '×',
    '÷': '÷',
  };
  
  if (isFirst) {
    // First card shows just the number (operator is ignored)
    return String(card.value);
  }
  
  return `${operatorDisplay[card.operator]}${card.value}`;
}
