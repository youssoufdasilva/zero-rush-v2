"use client";

import { useState, useCallback, useMemo } from "react";
import type { Card, Difficulty, PuzzleResult } from "@/lib/types/game";
import { findGoodPuzzleForDifficulty } from "@/lib/game/generate";
import { evaluate, isValidAnswer, cardToString } from "@/lib/game/evaluate";
import { DIFFICULTY_CONFIG } from "@/lib/game/constants";

/** A submission entry in the history */
export interface Submission {
  /** Unique ID for this submission */
  id: string;
  /** The card arrangement that was submitted */
  arrangement: Card[];
  /** Signature of arrangement for duplicate detection */
  signature: string;
  /** The evaluated result */
  result: number;
  /** Whether this matched dusk */
  isDusk: boolean;
  /** Whether this matched dawn */
  isDawn: boolean;
  /** Whether the result was invalid (negative or non-integer) */
  isInvalid: boolean;
  /** Timestamp of submission */
  timestamp: number;
}

/** Generate signature for an arrangement to detect duplicates */
function getArrangementSignature(arrangement: Card[]): string {
  return arrangement.map(card => cardToString(card)).join("");
}

export interface GameState {
  /** Cards remaining in hand (not yet placed) */
  handCards: Card[];
  /** Cards placed in arrangement area */
  arrangementCards: Card[];
  /** Current difficulty level */
  difficulty: Difficulty;
  /** Pre-calculated puzzle result with dusk/dawn values */
  puzzleResult: PuzzleResult;
  /** Whether dusk target has been found */
  foundDusk: boolean;
  /** Whether dawn target has been found */
  foundDawn: boolean;
  /** Number of submit attempts made */
  attempts: number;
  /** Auto-calculated result from current arrangement (only valid positive integers) */
  currentResult: number | null;
  /** Raw result from evaluation (including negatives/decimals) */
  rawResult: number | null;
  /** Whether game is complete (both targets found) */
  isComplete: boolean;
  /** Submission history */
  submissions: Submission[];
}

export interface UseGameReturn extends GameState {
  /** Generate a new puzzle */
  generateNewPuzzle: () => void;
  /** Add a card from hand to arrangement */
  addToArrangement: (card: Card) => void;
  /** Remove a card from arrangement back to hand */
  removeFromArrangement: (card: Card) => void;
  /** Reorder cards within arrangement (from drag and drop) */
  reorderArrangement: (newOrder: Card[]) => void;
  /** Submit current arrangement as an attempt */
  submitAttempt: () => { isDusk: boolean; isDawn: boolean; isDuplicate: boolean; value: number | null };
  /** Clear arrangement, return all cards to hand */
  clearArrangement: () => void;
  /** Reset the game to initial state */
  resetGame: () => void;
  /** Get card count for current difficulty */
  cardCount: number;
  /** Whether all cards are placed (ready to submit) */
  canSubmit: boolean;
  /** Max history length setting */
  maxHistoryLength: number;
  /** Set max history length */
  setMaxHistoryLength: (length: number) => void;
}

function createInitialPuzzle(difficulty: Difficulty): {
  cards: Card[];
  puzzleResult: PuzzleResult;
} {
  const { puzzle, result } = findGoodPuzzleForDifficulty(difficulty);
  return { cards: puzzle, puzzleResult: result };
}

/** Generate a unique ID for a card based on its properties and index */
function getCardId(card: Card, index: number): string {
  return `${cardToString(card)}-${index}`;
}

export function useGame(initialDifficulty: Difficulty = "medium"): UseGameReturn {
  const [difficulty] = useState<Difficulty>(initialDifficulty);
  const [maxHistoryLength, setMaxHistoryLength] = useState(10);
  
  // Initialize puzzle
  const [puzzleData, setPuzzleData] = useState(() => 
    createInitialPuzzle(initialDifficulty)
  );
  
  // Split cards into hand and arrangement
  const [handCards, setHandCards] = useState<Card[]>(puzzleData.cards);
  const [arrangementCards, setArrangementCards] = useState<Card[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [foundDusk, setFoundDusk] = useState(false);
  const [foundDawn, setFoundDawn] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isComplete = foundDusk && foundDawn;
  
  const cardCount = useMemo(() => 
    DIFFICULTY_CONFIG[difficulty].cards, 
    [difficulty]
  );

  // Auto-calculate raw result (including negatives/decimals)
  const rawResult = useMemo(() => {
    if (arrangementCards.length === 0) return null;
    const result = evaluate(arrangementCards);
    return result.answer;
  }, [arrangementCards]);

  // Current result is only valid positive integers
  const currentResult = useMemo(() => {
    if (rawResult === null) return null;
    if (!isValidAnswer(rawResult)) return null;
    return rawResult;
  }, [rawResult]);

  // Check if all cards are placed and result is valid
  const canSubmit = useMemo(() => {
    return handCards.length === 0 && currentResult !== null;
  }, [handCards.length, currentResult]);

  const generateNewPuzzle = useCallback(() => {
    const newPuzzleData = createInitialPuzzle(difficulty);
    setPuzzleData(newPuzzleData);
    setHandCards(newPuzzleData.cards);
    setArrangementCards([]);
    setSubmissions([]);
    setFoundDusk(false);
    setFoundDawn(false);
    setAttempts(0);
  }, [difficulty]);

  const addToArrangement = useCallback((card: Card) => {
    setHandCards(prev => {
      const index = prev.findIndex(
        c => c.operator === card.operator && c.value === card.value
      );
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
    setArrangementCards(prev => [...prev, card]);
  }, []);

  const removeFromArrangement = useCallback((card: Card) => {
    setArrangementCards(prev => {
      const index = prev.findIndex(
        c => c.operator === card.operator && c.value === card.value
      );
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
    setHandCards(prev => [...prev, card]);
  }, []);

  const reorderArrangement = useCallback((newOrder: Card[]) => {
    setArrangementCards(newOrder);
  }, []);

  const clearArrangement = useCallback(() => {
    setHandCards(prev => [...prev, ...arrangementCards]);
    setArrangementCards([]);
  }, [arrangementCards]);

  const submitAttempt = useCallback(() => {
    if (handCards.length > 0) {
      // Not all cards placed
      return { isDusk: false, isDawn: false, isDuplicate: false, value: null };
    }

    // Check for duplicate submission
    const currentSignature = getArrangementSignature(arrangementCards);
    const isDuplicate = submissions.some(sub => sub.signature === currentSignature);
    
    if (isDuplicate) {
      // Don't count as attempt, just signal duplicate
      return { isDusk: false, isDawn: false, isDuplicate: true, value: null };
    }

    const result = evaluate(arrangementCards);
    const answer = result.answer;
    const isValid = isValidAnswer(answer);
    
    setAttempts(prev => prev + 1);
    
    const isDusk = isValid && answer === puzzleData.puzzleResult.dusk.result && !foundDusk;
    const isDawn = isValid && answer === puzzleData.puzzleResult.dawn.result && !foundDawn;
    
    // Create submission record
    const submission: Submission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      arrangement: [...arrangementCards],
      signature: currentSignature,
      result: answer,
      isDusk,
      isDawn,
      isInvalid: !isValid,
      timestamp: Date.now(),
    };
    
    // Add to history (limited by maxHistoryLength)
    setSubmissions(prev => {
      const newSubmissions = [submission, ...prev];
      return newSubmissions.slice(0, maxHistoryLength);
    });
    
    if (isDusk) {
      setFoundDusk(true);
    }
    
    if (isDawn) {
      setFoundDawn(true);
    }
    
    return { isDusk, isDawn, isDuplicate: false, value: isValid ? answer : null };
  }, [arrangementCards, handCards.length, puzzleData.puzzleResult, foundDusk, foundDawn, maxHistoryLength, submissions]);

  const resetGame = useCallback(() => {
    setHandCards(puzzleData.cards);
    setArrangementCards([]);
    setSubmissions([]);
    setFoundDusk(false);
    setFoundDawn(false);
    setAttempts(0);
  }, [puzzleData.cards]);

  return {
    handCards,
    arrangementCards,
    difficulty,
    puzzleResult: puzzleData.puzzleResult,
    foundDusk,
    foundDawn,
    attempts,
    currentResult,
    rawResult,
    isComplete,
    submissions,
    generateNewPuzzle,
    addToArrangement,
    removeFromArrangement,
    reorderArrangement,
    submitAttempt,
    clearArrangement,
    resetGame,
    cardCount,
    canSubmit,
    maxHistoryLength,
    setMaxHistoryLength,
  };
}
