/**
 * Canonical signature functions for Zero Rush v2
 * 
 * Signatures provide a unique, canonical representation of a puzzle
 * that can be used for:
 * - Deduplication (same cards in different order = same puzzle)
 * - Sharing (compact string format)
 * - Database storage and lookup
 * 
 * Sorting order:
 * - Operators: + < - < * < ÷
 * - Numbers: Numeric order (1 < 2 < 10, not lexicographic)
 */

import type { Card, CardString, Operator } from '../types/game';
import { parseCard, cardToString } from './evaluate';
import { OPERATOR_ORDER } from './constants';

// =============================================================================
// Signature Generation
// =============================================================================

/**
 * Generate a canonical signature from cards
 * 
 * Cards are sorted by:
 * 1. Operator: + < - < * < ÷
 * 2. Value: numeric order
 * 
 * @param cards - Array of Card objects
 * @returns Canonical signature string (e.g., "+3,-5,*2,÷4")
 * 
 * @example
 * toCanonicalSignature([
 *   { operator: '÷', value: 4 },
 *   { operator: '*', value: 2 },
 *   { operator: '+', value: 3 },
 *   { operator: '-', value: 5 }
 * ]) // → "+3,-5,*2,÷4"
 */
export function toCanonicalSignature(cards: Card[]): string {
  return [...cards]
    .sort(compareCards)
    .map(cardToString)
    .join(',');
}

/**
 * Generate a canonical signature from card strings
 * 
 * @param cardStrings - Array of card strings (e.g., ["÷4", "*2", "+3", "-5"])
 * @returns Canonical signature string
 * 
 * @example
 * signatureFromStrings(["÷4", "*2", "+3", "-5"]) // → "+3,-5,*2,÷4"
 */
export function signatureFromStrings(cardStrings: string[]): string {
  const cards = cardStrings.map(parseCard);
  return toCanonicalSignature(cards);
}

// =============================================================================
// Signature Parsing
// =============================================================================

/**
 * Parse a signature string back into Card objects
 * 
 * @param signature - Canonical signature string
 * @returns Array of Card objects (in canonical order)
 * 
 * @example
 * fromSignature("+3,-5,*2,÷4")
 * // → [{ operator: '+', value: 3 }, { operator: '-', value: 5 }, ...]
 */
export function fromSignature(signature: string): Card[] {
  if (!signature || signature.trim() === '') {
    return [];
  }
  
  return signature
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(parseCard);
}

/**
 * Parse a signature to card strings
 * 
 * @param signature - Canonical signature string
 * @returns Array of card strings
 */
export function signatureToStrings(signature: string): CardString[] {
  return fromSignature(signature).map(cardToString);
}

// =============================================================================
// Comparison Functions
// =============================================================================

/**
 * Compare two cards for sorting
 * 
 * Sorting order:
 * 1. By operator: + < - < * < ÷
 * 2. By value: numeric order
 */
export function compareCards(a: Card, b: Card): number {
  // First, compare by operator
  const opOrderA = OPERATOR_ORDER[a.operator];
  const opOrderB = OPERATOR_ORDER[b.operator];
  
  if (opOrderA !== opOrderB) {
    return opOrderA - opOrderB;
  }
  
  // Then, compare by value (numeric)
  return a.value - b.value;
}

/**
 * Compare two card strings for sorting
 */
export function compareCardStrings(a: string, b: string): number {
  return compareCards(parseCard(a), parseCard(b));
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Check if a string is a valid signature
 */
export function isValidSignature(signature: string): boolean {
  if (!signature || signature.trim() === '') {
    return false;
  }
  
  try {
    const cards = fromSignature(signature);
    
    // Must have at least 1 card
    if (cards.length === 0) {
      return false;
    }
    
    // Verify signature is in canonical order
    const canonical = toCanonicalSignature(cards);
    return signature === canonical;
  } catch {
    return false;
  }
}

/**
 * Check if two puzzles are equivalent (same cards, possibly different order)
 */
export function puzzlesAreEquivalent(cards1: Card[], cards2: Card[]): boolean {
  if (cards1.length !== cards2.length) {
    return false;
  }
  
  return toCanonicalSignature(cards1) === toCanonicalSignature(cards2);
}

/**
 * Check if two signatures represent the same puzzle
 */
export function signaturesAreEqual(sig1: string, sig2: string): boolean {
  return sig1 === sig2;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Normalize a signature (ensure canonical order)
 * 
 * Useful when receiving user input that might not be in canonical order.
 */
export function normalizeSignature(signature: string): string {
  const cards = fromSignature(signature);
  return toCanonicalSignature(cards);
}

/**
 * Get a human-readable display of a signature
 * Uses proper math symbols and spacing
 */
export function signatureToDisplay(signature: string): string {
  const cards = fromSignature(signature);
  
  const operatorDisplay: Record<Operator, string> = {
    '+': '+',
    '-': '−', // proper minus sign
    '*': '×',
    '÷': '÷',
  };
  
  return cards
    .map(card => `${operatorDisplay[card.operator]}${card.value}`)
    .join(' ');
}

/**
 * Generate a short hash of a signature for display purposes
 * (Not cryptographically secure, just for UI identification)
 */
export function signatureToShortHash(signature: string): string {
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base36 and take first 6 characters
  return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
}

// =============================================================================
// URL-Safe Encoding
// =============================================================================

/**
 * Encode a signature for use in URLs
 * 
 * Replaces characters that might cause issues:
 * - ÷ → 'd' (divide)
 * - * → 'm' (multiply)
 * - + → 'a' (add)
 * - - → 's' (subtract)
 * - , → '_'
 */
export function encodeSignatureForUrl(signature: string): string {
  return signature
    .replace(/÷/g, 'd')
    .replace(/\*/g, 'm')
    .replace(/\+/g, 'a')
    .replace(/-/g, 's')
    .replace(/,/g, '_');
}

/**
 * Decode a URL-encoded signature back to canonical form
 */
export function decodeSignatureFromUrl(encoded: string): string {
  return encoded
    .replace(/d/g, '÷')
    .replace(/m/g, '*')
    .replace(/a/g, '+')
    .replace(/s/g, '-')
    .replace(/_/g, ',');
}
