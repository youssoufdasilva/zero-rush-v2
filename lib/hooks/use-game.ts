"use client";

import { useState, useCallback, useMemo } from "react";
import type { Card, Difficulty, PuzzleResult, Slot, AutoOrgMode } from "@/lib/types/game";
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
  /** Slot-based hand state (may contain nulls when auto-org is off) */
  handSlots: Slot[];
  /** Slot-based table state (may contain nulls when auto-org is off) */
  tableSlots: Slot[];
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
  /** Auto-organization mode */
  autoOrgMode: AutoOrgMode;
  /** Set auto-organization mode */
  setAutoOrgMode: (mode: AutoOrgMode) => void;
  /** Whether card slots are enabled */
  useCardSlots: boolean;
  /** Set whether card slots are enabled */
  setUseCardSlots: (enabled: boolean) => void;
  /** Move a card from hand slot to table slot */
  addToTableAtSlot: (handIndex: number, tableIndex?: number) => void;
  /** Remove a card from table slot back to hand */
  removeFromTableAtSlot: (tableIndex: number) => void;
  /** Swap two slots within the table */
  swapWithinTable: (fromIndex: number, toIndex: number) => void;
  /** Swap two slots within the hand */
  swapWithinHand: (fromIndex: number, toIndex: number) => void;
}

function createInitialPuzzle(difficulty: Difficulty): {
  cards: Card[];
  puzzleResult: PuzzleResult;
} {
  const { puzzle, result } = findGoodPuzzleForDifficulty(difficulty);
  return { cards: puzzle, puzzleResult: result };
}

export function useGame(initialDifficulty: Difficulty = "medium"): UseGameReturn {
  const [difficulty] = useState<Difficulty>(initialDifficulty);
  const [maxHistoryLength, setMaxHistoryLength] = useState(10);
  const [autoOrgMode, setAutoOrgMode] = useState<AutoOrgMode>("both");
  const [useCardSlots, setUseCardSlots] = useState(true);

  // Initialize puzzle
  const [puzzleData, setPuzzleData] = useState(() =>
    createInitialPuzzle(initialDifficulty)
  );

  // Slot-based state (may contain nulls when auto-org is off)
  const [handSlots, setHandSlots] = useState<Slot[]>(puzzleData.cards);
  const [tableSlots, setTableSlots] = useState<Slot[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [foundDusk, setFoundDusk] = useState(false);
  const [foundDawn, setFoundDawn] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isComplete = foundDusk && foundDawn;

  const cardCount = useMemo(() =>
    DIFFICULTY_CONFIG[difficulty].cards,
    [difficulty]
  );

  // Derived state: filtered cards for backward compatibility
  const handCards = useMemo(() =>
    handSlots.filter((slot): slot is Card => slot != null),
    [handSlots]
  );

  const arrangementCards = useMemo(() =>
    tableSlots.filter((slot): slot is Card => slot != null),
    [tableSlots]
  );

  // Check if auto-org is enabled for each zone
  const handAutoOrg = autoOrgMode === "hand" || autoOrgMode === "both";
  const tableAutoOrg = autoOrgMode === "table" || autoOrgMode === "both";

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
    setHandSlots(newPuzzleData.cards);
    setTableSlots([]);
    setSubmissions([]);
    setFoundDusk(false);
    setFoundDawn(false);
    setAttempts(0);
  }, [difficulty]);

  const addToArrangement = useCallback((card: Card) => {
    setHandSlots((prev) => {
      const index = prev.findIndex(
        (c) => c !== null && c.operator === card.operator && c.value === card.value
      );
      if (index === -1) return prev;
      if (handAutoOrg) {
        // Auto-organize: remove the slot entirely
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      } else {
        // Leave null gap
        const newSlots = [...prev];
        newSlots[index] = null;
        return newSlots;
      }
    });
    setTableSlots((prev) => [...prev, card]);
  }, [handAutoOrg]);

  const removeFromArrangement = useCallback((card: Card) => {
    setTableSlots((prev) => {
      const index = prev.findIndex(
        (c) => c !== null && c.operator === card.operator && c.value === card.value
      );
      if (index === -1) return prev;
      if (tableAutoOrg) {
        // Auto-organize: remove the slot entirely
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      } else {
        // Leave null gap
        const newSlots = [...prev];
        newSlots[index] = null;
        return newSlots;
      }
    });
    // Add card back to hand - find first empty slot or append
    setHandSlots((prev) => {
      if (handAutoOrg) {
        return [...prev, card];
      }
      const emptyIndex = prev.findIndex((s) => s === null);
      if (emptyIndex !== -1) {
        const newSlots = [...prev];
        newSlots[emptyIndex] = card;
        return newSlots;
      }
      return [...prev, card];
    });
  }, [tableAutoOrg, handAutoOrg]);

  const reorderArrangement = useCallback((newOrder: Card[]) => {
    setTableSlots(newOrder);
  }, []);

  const clearArrangement = useCallback(() => {
    // Return all cards from table to hand
    const cardsToReturn = tableSlots.filter((s): s is Card => s !== null);
    setHandSlots((prev) => {
      if (handAutoOrg) {
        return [...prev.filter((s): s is Card => s !== null), ...cardsToReturn];
      }
      // Fill in empty slots first, then append
      const newSlots = [...prev];
      let returnIndex = 0;
      for (let i = 0; i < newSlots.length && returnIndex < cardsToReturn.length; i++) {
        if (newSlots[i] === null) {
          newSlots[i] = cardsToReturn[returnIndex++];
        }
      }
      // Append remaining cards
      while (returnIndex < cardsToReturn.length) {
        newSlots.push(cardsToReturn[returnIndex++]);
      }
      return newSlots;
    });
    setTableSlots([]);
  }, [tableSlots, handAutoOrg]);

  // Slot-based operations
  const addToTableAtSlot = useCallback((handIndex: number, tableIndex?: number) => {
    const card = handSlots[handIndex];
    if (!card) return; // Handle both null and undefined (out of bounds)

    // Remove from hand
    setHandSlots((prev) => {
      if (handAutoOrg) {
        return [...prev.slice(0, handIndex), ...prev.slice(handIndex + 1)];
      }
      const newSlots = [...prev];
      newSlots[handIndex] = null;
      return newSlots;
    });

    // Add to table
    setTableSlots((prev) => {
      if (tableIndex !== undefined && tableIndex >= 0) {
        // Insert at specific index
        if (tableIndex < prev.length && prev[tableIndex] === null) {
          // Fill empty slot
          const newSlots = [...prev];
          newSlots[tableIndex] = card;
          return newSlots;
        }
        // Insert at position
        return [...prev.slice(0, tableIndex), card, ...prev.slice(tableIndex)];
      }
      // Find first empty slot or append
      const emptyIndex = prev.findIndex((s) => s === null);
      if (emptyIndex !== -1) {
        const newSlots = [...prev];
        newSlots[emptyIndex] = card;
        return newSlots;
      }
      return [...prev, card];
    });
  }, [handSlots, handAutoOrg]);

  const removeFromTableAtSlot = useCallback((tableIndex: number) => {
    const card = tableSlots[tableIndex];
    if (!card) return; // Handle both null and undefined (out of bounds)

    // Remove from table
    setTableSlots((prev) => {
      if (tableAutoOrg) {
        return [...prev.slice(0, tableIndex), ...prev.slice(tableIndex + 1)];
      }
      const newSlots = [...prev];
      newSlots[tableIndex] = null;
      return newSlots;
    });

    // Add back to hand
    setHandSlots((prev) => {
      if (handAutoOrg) {
        return [...prev, card];
      }
      const emptyIndex = prev.findIndex((s) => s === null);
      if (emptyIndex !== -1) {
        const newSlots = [...prev];
        newSlots[emptyIndex] = card;
        return newSlots;
      }
      return [...prev, card];
    });
  }, [tableSlots, tableAutoOrg, handAutoOrg]);

  const swapWithinTable = useCallback((fromIndex: number, toIndex: number) => {
    setTableSlots((prev) => {
      const newSlots = [...prev];
      const temp = newSlots[fromIndex];
      newSlots[fromIndex] = newSlots[toIndex];
      newSlots[toIndex] = temp;
      return newSlots;
    });
  }, []);

  const swapWithinHand = useCallback((fromIndex: number, toIndex: number) => {
    setHandSlots((prev) => {
      const newSlots = [...prev];
      const temp = newSlots[fromIndex];
      newSlots[fromIndex] = newSlots[toIndex];
      newSlots[toIndex] = temp;
      return newSlots;
    });
  }, []);

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
    setHandSlots(puzzleData.cards);
    setTableSlots([]);
    setSubmissions([]);
    setFoundDusk(false);
    setFoundDawn(false);
    setAttempts(0);
  }, [puzzleData.cards]);

  return {
    handCards,
    arrangementCards,
    handSlots,
    tableSlots,
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
    autoOrgMode,
    setAutoOrgMode,
    useCardSlots,
    setUseCardSlots,
    addToTableAtSlot,
    removeFromTableAtSlot,
    swapWithinTable,
    swapWithinHand,
  };
}
