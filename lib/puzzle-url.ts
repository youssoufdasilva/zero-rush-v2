/**
 * URL utilities for puzzle sharing
 *
 * Provides functions to encode puzzles into shareable URLs and decode them back.
 * Uses the existing signature encoding from lib/game/signature.ts
 */

import type { Card, Difficulty } from './types/game';
import {
  toCanonicalSignature,
  fromSignature,
  encodeSignatureForUrl,
  decodeSignatureFromUrl,
  isValidSignature
} from './game/signature';
import { isValidAnswer } from './game/evaluate';
import { generateAnswers } from './game/generate';

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'challenger'];

export interface DecodedPuzzle {
  cards: Card[];
  difficulty: Difficulty;
  signature: string;
  duskValue: number;
  dawnValue: number;
}

/**
 * Encode a puzzle into a URL path
 *
 * @param cards - The puzzle cards
 * @param difficulty - The difficulty level
 * @returns URL path like "/play/medium/a3_s5_m2_d4"
 */
export function encodePuzzleToUrl(cards: Card[], difficulty: Difficulty): string {
  const signature = toCanonicalSignature(cards);
  const encoded = encodeSignatureForUrl(signature);
  return `/play/${difficulty}/${encoded}`;
}

/**
 * Decode a puzzle from URL parameters
 *
 * @param difficulty - The difficulty from URL
 * @param encoded - The encoded puzzle string from URL
 * @returns Decoded puzzle data or null if invalid
 */
export function decodePuzzleFromUrl(
  difficulty: string,
  encoded: string
): DecodedPuzzle | null {
  // Validate difficulty
  if (!VALID_DIFFICULTIES.includes(difficulty as Difficulty)) {
    return null;
  }

  try {
    // Decode the signature
    const signature = decodeSignatureFromUrl(encoded);

    // Parse cards from signature
    const cards = fromSignature(signature);

    // Validate we have cards
    if (cards.length === 0) {
      return null;
    }

    // Validate the signature is canonical
    if (!isValidSignature(signature)) {
      return null;
    }

    // Solve the puzzle to get dusk/dawn values
    const puzzleResult = generateAnswers(cards);

    // Validate the puzzle has valid answers
    if (!puzzleResult.hasValidAnswers) {
      return null;
    }

    // Validate dusk and dawn are valid answers
    if (!isValidAnswer(puzzleResult.dusk.result) || !isValidAnswer(puzzleResult.dawn.result)) {
      return null;
    }

    return {
      cards,
      difficulty: difficulty as Difficulty,
      signature,
      duskValue: puzzleResult.dusk.result,
      dawnValue: puzzleResult.dawn.result,
    };
  } catch {
    return null;
  }
}

/**
 * Get a full shareable URL for a puzzle
 *
 * @param cards - The puzzle cards
 * @param difficulty - The difficulty level
 * @returns Full URL with origin (e.g., "https://zerorush.app/play/medium/a3_s5_m2_d4")
 */
export function getShareUrl(cards: Card[], difficulty: Difficulty): string {
  const path = encodePuzzleToUrl(cards, difficulty);

  // In browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  // Fallback for SSR - just return the path
  return path;
}

/**
 * Check if a URL path is a valid puzzle URL
 *
 * @param path - URL path to check
 * @returns true if path matches /play/[difficulty]/[puzzle] format
 */
export function isPuzzleUrl(path: string): boolean {
  const match = path.match(/^\/play\/([^/]+)\/([^/]+)$/);
  if (!match) return false;

  const [, difficulty, encoded] = match;
  return decodePuzzleFromUrl(difficulty, encoded) !== null;
}
