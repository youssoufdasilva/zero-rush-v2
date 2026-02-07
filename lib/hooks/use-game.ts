"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  Card,
  Difficulty,
  PuzzleResult,
  Slot,
  AutoOrgMode,
  HintState,
  HintedCard,
} from "@/lib/types/game";
import {
  findGoodPuzzleForDifficulty,
  generateAnswers,
} from "@/lib/game/generate";
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
  return arrangement.map((card) => cardToString(card)).join("");
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
  /** Hint state for solution reveals */
  hints: HintState;
}

export interface UseGameReturn extends GameState {
  /** Original puzzle cards (for sharing) */
  puzzleCards: Card[];
  /** Generate a new puzzle */
  generateNewPuzzle: () => void;
  /** Add a card from hand to arrangement */
  addToArrangement: (card: Card) => void;
  /** Remove a card from arrangement back to hand */
  removeFromArrangement: (card: Card) => void;
  /** Reorder cards within arrangement (from drag and drop) */
  reorderArrangement: (newOrder: Card[]) => void;
  /** Submit current arrangement as an attempt */
  submitAttempt: () => {
    isDusk: boolean;
    isDawn: boolean;
    isDuplicate: boolean;
    value: number | null;
  };
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
  /** Reveal the next hint card for the specified target */
  revealNextHint: (target: "dusk" | "dawn") => void;
  /** Resume showing hints for a target without revealing a new card */
  resumeHints: (target: "dusk" | "dawn") => void;
  /** Clear all active hints and restore normal mode */
  clearHints: () => void;
  /** Clear only non-hinted cards from the table, keeping hinted cards in place */
  clearNonHintedCards: () => void;
  /** Get currently active hinted cards with their positions */
  getHintedCards: () => HintedCard[];
  /** Check if a card in the table is a hinted card (locked) */
  isHintedCard: (card: Card, index: number) => boolean;
}

function createInitialPuzzle(difficulty: Difficulty): {
  cards: Card[];
  puzzleResult: PuzzleResult;
} {
  const { puzzle, result } = findGoodPuzzleForDifficulty(difficulty);
  return { cards: puzzle, puzzleResult: result };
}

function createPuzzleFromCards(cards: Card[]): {
  cards: Card[];
  puzzleResult: PuzzleResult;
} {
  const puzzleResult = generateAnswers(cards);
  return { cards, puzzleResult };
}

export interface UseGameOptions {
  /** Initial difficulty level */
  difficulty?: Difficulty;
  /** Provided cards (for shared puzzles) */
  providedCards?: Card[];
}

export function useGame(
  initialDifficultyOrOptions: Difficulty | UseGameOptions = "medium"
): UseGameReturn {
  // Handle both old signature (just difficulty) and new options object
  const options: UseGameOptions =
    typeof initialDifficultyOrOptions === "string"
      ? { difficulty: initialDifficultyOrOptions }
      : initialDifficultyOrOptions;

  const initialDifficulty = options.difficulty ?? "medium";
  const providedCards = options.providedCards;

  const [difficulty] = useState<Difficulty>(initialDifficulty);
  const [maxHistoryLength, setMaxHistoryLength] = useState(10);
  const [autoOrgMode, setAutoOrgMode] = useState<AutoOrgMode>("both");
  const [useCardSlots, setUseCardSlots] = useState(true);

  // Initialize puzzle - use provided cards if available
  const [puzzleData, setPuzzleData] = useState(() =>
    providedCards
      ? createPuzzleFromCards(providedCards)
      : createInitialPuzzle(initialDifficulty)
  );

  // Slot-based state (may contain nulls when auto-org is off)
  const [handSlots, setHandSlots] = useState<Slot[]>(puzzleData.cards);
  const [tableSlots, setTableSlots] = useState<Slot[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [foundDusk, setFoundDusk] = useState(false);
  const [foundDawn, setFoundDawn] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Hint state for solution reveals
  const [hints, setHints] = useState<HintState>({
    dusk: [],
    dawn: [],
    activeTarget: null,
  });

  const isComplete = foundDusk && foundDawn;

  const cardCount = useMemo(
    () => DIFFICULTY_CONFIG[difficulty].cards,
    [difficulty]
  );

  // Derived state: filtered cards for backward compatibility
  const handCards = useMemo(
    () => handSlots.filter((slot): slot is Card => slot != null),
    [handSlots]
  );

  const arrangementCards = useMemo(
    () => tableSlots.filter((slot): slot is Card => slot != null),
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
    setHints({ dusk: [], dawn: [], activeTarget: null });
  }, [difficulty]);

  const addToArrangement = useCallback(
    (card: Card) => {
      setHandSlots((prev) => {
        const index = prev.findIndex(
          (c) =>
            c !== null && c.operator === card.operator && c.value === card.value
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
    },
    [handAutoOrg]
  );

  const removeFromArrangement = useCallback(
    (card: Card) => {
      setTableSlots((prev) => {
        const index = prev.findIndex(
          (c) =>
            c !== null && c.operator === card.operator && c.value === card.value
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
    },
    [tableAutoOrg, handAutoOrg]
  );

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
      for (
        let i = 0;
        i < newSlots.length && returnIndex < cardsToReturn.length;
        i++
      ) {
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
  const addToTableAtSlot = useCallback(
    (handIndex: number, tableIndex?: number) => {
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
          return [
            ...prev.slice(0, tableIndex),
            card,
            ...prev.slice(tableIndex),
          ];
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
    },
    [handSlots, handAutoOrg]
  );

  const removeFromTableAtSlot = useCallback(
    (tableIndex: number) => {
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
    },
    [tableSlots, tableAutoOrg, handAutoOrg]
  );

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

  // Helper to check if two cards are the same
  const isSameCard = useCallback((a: Card, b: Card): boolean => {
    return a.operator === b.operator && a.value === b.value;
  }, []);

  // Reveal next hint card for the specified target
  const revealNextHint = useCallback(
    (target: "dusk" | "dawn") => {
      const solution =
        target === "dusk"
          ? puzzleData.puzzleResult.dusk.arrangement
          : puzzleData.puzzleResult.dawn.arrangement;

      setHints((prev) => {
        const currentReveals = prev[target];
        const nextIndex = currentReveals.length;

        // If we've already revealed all cards, do nothing
        if (nextIndex >= solution.length) {
          return prev;
        }

        const nextCard = solution[nextIndex];

        // All hinted cards for this target (including the new one)
        const allHintsForTarget = [...currentReveals, nextCard];

        // Clear table and return only NON-hinted cards to hand
        setTableSlots((tableState) => {
          const tableCards = tableState.filter((s): s is Card => s !== null);

          // Identify which table cards are NOT in the hints
          const nonHintedTableCards: Card[] = [];
          const hintedCardsUsed = [...allHintsForTarget];

          for (const tableCard of tableCards) {
            const hintIndex = hintedCardsUsed.findIndex((h) =>
              isSameCard(h, tableCard)
            );
            if (hintIndex !== -1) {
              // This card matches a hint, remove from available hints
              hintedCardsUsed.splice(hintIndex, 1);
            } else {
              // This card is not hinted, return to hand
              nonHintedTableCards.push(tableCard);
            }
          }

          // Return non-hinted cards to hand
          if (nonHintedTableCards.length > 0) {
            setHandSlots((handState) => {
              if (handAutoOrg) {
                return [
                  ...handState.filter((s): s is Card => s !== null),
                  ...nonHintedTableCards,
                ];
              }
              // Fill in empty slots first
              const newSlots = [...handState];
              let returnIndex = 0;
              for (
                let i = 0;
                i < newSlots.length && returnIndex < nonHintedTableCards.length;
                i++
              ) {
                if (newSlots[i] === null) {
                  newSlots[i] = nonHintedTableCards[returnIndex++];
                }
              }
              while (returnIndex < nonHintedTableCards.length) {
                newSlots.push(nonHintedTableCards[returnIndex++]);
              }
              return newSlots;
            });
          }

          // Clear the table (will place hinted cards next)
          return [];
        });

        // Remove hinted cards from hand and place on table
        setHandSlots((handState) => {
          let newHandSlots = [...handState];

          for (const hintCard of allHintsForTarget) {
            const handIndex = newHandSlots.findIndex(
              (c) => c !== null && isSameCard(c, hintCard)
            );
            if (handIndex !== -1) {
              if (handAutoOrg) {
                newHandSlots = [
                  ...newHandSlots.slice(0, handIndex),
                  ...newHandSlots.slice(handIndex + 1),
                ];
              } else {
                newHandSlots[handIndex] = null;
              }
            }
          }
          return newHandSlots;
        });

        // Place hinted cards on table in order
        setTableSlots(() => {
          return [...allHintsForTarget];
        });

        return {
          ...prev,
          [target]: allHintsForTarget,
          activeTarget: target,
        };
      });
    },
    [puzzleData.puzzleResult, handAutoOrg, isSameCard]
  );

  // Resume showing hints for a target without revealing a new card
  const resumeHints = useCallback(
    (target: "dusk" | "dawn") => {
      setHints((prev) => {
        const existingHints = prev[target];

        // If no hints for this target, do nothing
        if (existingHints.length === 0) {
          return prev;
        }

        // If already active for this target, do nothing
        if (prev.activeTarget === target) {
          return prev;
        }

        // Clear table and return only NON-hinted cards to hand
        setTableSlots((tableState) => {
          const tableCards = tableState.filter((s): s is Card => s !== null);

          // Identify which table cards are NOT in the hints
          const nonHintedTableCards: Card[] = [];
          const hintedCardsUsed = [...existingHints];

          for (const tableCard of tableCards) {
            const hintIndex = hintedCardsUsed.findIndex((h) =>
              isSameCard(h, tableCard)
            );
            if (hintIndex !== -1) {
              // This card matches a hint, remove from available hints
              hintedCardsUsed.splice(hintIndex, 1);
            } else {
              // This card is not hinted, return to hand
              nonHintedTableCards.push(tableCard);
            }
          }

          // Return non-hinted cards to hand
          if (nonHintedTableCards.length > 0) {
            setHandSlots((handState) => {
              if (handAutoOrg) {
                return [
                  ...handState.filter((s): s is Card => s !== null),
                  ...nonHintedTableCards,
                ];
              }
              // Fill in empty slots first
              const newSlots = [...handState];
              let returnIndex = 0;
              for (
                let i = 0;
                i < newSlots.length && returnIndex < nonHintedTableCards.length;
                i++
              ) {
                if (newSlots[i] === null) {
                  newSlots[i] = nonHintedTableCards[returnIndex++];
                }
              }
              while (returnIndex < nonHintedTableCards.length) {
                newSlots.push(nonHintedTableCards[returnIndex++]);
              }
              return newSlots;
            });
          }

          // Clear the table (will place hinted cards next)
          return [];
        });

        // Remove hinted cards from hand
        setHandSlots((handState) => {
          let newHandSlots = [...handState];

          for (const hintCard of existingHints) {
            const handIndex = newHandSlots.findIndex(
              (c) => c !== null && isSameCard(c, hintCard)
            );
            if (handIndex !== -1) {
              if (handAutoOrg) {
                newHandSlots = [
                  ...newHandSlots.slice(0, handIndex),
                  ...newHandSlots.slice(handIndex + 1),
                ];
              } else {
                newHandSlots[handIndex] = null;
              }
            }
          }
          return newHandSlots;
        });

        // Place hinted cards on table in order
        setTableSlots(() => {
          return [...existingHints];
        });

        return {
          ...prev,
          activeTarget: target,
        };
      });
    },
    [handAutoOrg, isSameCard]
  );

  // Clear all active hints
  const clearHints = useCallback(() => {
    setHints((prev) => {
      if (!prev.activeTarget) {
        return prev; // No active hints to clear
      }

      const activeHints = prev[prev.activeTarget];
      const hintedCount = activeHints.length;

      if (hintedCount > 0) {
        // Remove hinted cards from table (first N cards) and keep any user-placed cards
        setTableSlots((tableState) => {
          // User-placed cards are after the hinted ones
          return tableState.slice(hintedCount);
        });

        // Return hinted cards to hand (only those not already in hand)
        setHandSlots((handState) => {
          const existingHandCards = handState.filter(
            (s): s is Card => s !== null
          );

          // Filter out hints that are already in hand to avoid duplicates
          const hintsToReturn: Card[] = [];
          const usedHandCards = [...existingHandCards];

          for (const hint of activeHints) {
            const alreadyInHandIndex = usedHandCards.findIndex((c) =>
              isSameCard(c, hint)
            );
            if (alreadyInHandIndex !== -1) {
              // Card already in hand, mark it as used but don't add again
              usedHandCards.splice(alreadyInHandIndex, 1);
            } else {
              // Card not in hand, need to return it
              hintsToReturn.push(hint);
            }
          }

          if (hintsToReturn.length === 0) {
            return handState; // Nothing to add
          }

          if (handAutoOrg) {
            return [...existingHandCards, ...hintsToReturn];
          }
          // Fill in empty slots first
          const newSlots = [...handState];
          let hintIndex = 0;
          for (
            let i = 0;
            i < newSlots.length && hintIndex < hintsToReturn.length;
            i++
          ) {
            if (newSlots[i] === null) {
              newSlots[i] = hintsToReturn[hintIndex++];
            }
          }
          // Append remaining hints
          while (hintIndex < hintsToReturn.length) {
            newSlots.push(hintsToReturn[hintIndex++]);
          }
          return newSlots;
        });
      }

      return {
        dusk: prev.dusk, // Preserve progress
        dawn: prev.dawn, // Preserve progress
        activeTarget: null,
      };
    });
  }, [handAutoOrg, isSameCard]);

  // Clear only non-hinted cards from table, keeping hinted cards in place
  const clearNonHintedCards = useCallback(() => {
    if (!hints.activeTarget) {
      // No hints active, behave like normal clear
      clearArrangement();
      return;
    }

    const activeHints = hints[hints.activeTarget];
    const hintedCount = activeHints.length;

    // Get non-hinted cards from table (everything after the hinted ones)
    setTableSlots((tableState) => {
      const nonHintedCards = tableState
        .slice(hintedCount)
        .filter((s): s is Card => s !== null);

      // Return non-hinted cards to hand
      if (nonHintedCards.length > 0) {
        setHandSlots((handState) => {
          if (handAutoOrg) {
            return [
              ...handState.filter((s): s is Card => s !== null),
              ...nonHintedCards,
            ];
          }
          // Fill in empty slots first
          const newSlots = [...handState];
          let returnIndex = 0;
          for (
            let i = 0;
            i < newSlots.length && returnIndex < nonHintedCards.length;
            i++
          ) {
            if (newSlots[i] === null) {
              newSlots[i] = nonHintedCards[returnIndex++];
            }
          }
          while (returnIndex < nonHintedCards.length) {
            newSlots.push(nonHintedCards[returnIndex++]);
          }
          return newSlots;
        });
      }

      // Keep only hinted cards on table
      return tableState.slice(0, hintedCount);
    });
  }, [hints, handAutoOrg, clearArrangement]);

  // Get currently active hinted cards with positions
  const getHintedCards = useCallback((): HintedCard[] => {
    if (!hints.activeTarget) return [];

    const activeHints = hints[hints.activeTarget];
    return activeHints.map((card, index) => ({
      card,
      position: index + 1, // 1-indexed for display
      theme: hints.activeTarget!,
    }));
  }, [hints]);

  // Check if a card in the table is a hinted card
  const isHintedCard = useCallback(
    (card: Card, index: number): boolean => {
      if (!hints.activeTarget) return false;

      const activeHints = hints[hints.activeTarget];
      // Hinted cards are placed at the beginning of the table
      return index < activeHints.length;
    },
    [hints]
  );

  const submitAttempt = useCallback(() => {
    if (handCards.length > 0) {
      // Not all cards placed
      return { isDusk: false, isDawn: false, isDuplicate: false, value: null };
    }

    // Check for duplicate submission
    const currentSignature = getArrangementSignature(arrangementCards);
    const isDuplicate = submissions.some(
      (sub) => sub.signature === currentSignature
    );

    if (isDuplicate) {
      // Don't count as attempt, just signal duplicate
      return { isDusk: false, isDawn: false, isDuplicate: true, value: null };
    }

    const result = evaluate(arrangementCards);
    const answer = result.answer;
    const isValid = isValidAnswer(answer);

    setAttempts((prev) => prev + 1);

    const isDusk =
      isValid && answer === puzzleData.puzzleResult.dusk.result && !foundDusk;
    const isDawn =
      isValid && answer === puzzleData.puzzleResult.dawn.result && !foundDawn;

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
    setSubmissions((prev) => {
      const newSubmissions = [submission, ...prev];
      return newSubmissions.slice(0, maxHistoryLength);
    });

    if (isDusk) {
      setFoundDusk(true);
    }

    if (isDawn) {
      setFoundDawn(true);
    }

    return {
      isDusk,
      isDawn,
      isDuplicate: false,
      value: isValid ? answer : null,
    };
  }, [
    arrangementCards,
    handCards.length,
    puzzleData.puzzleResult,
    foundDusk,
    foundDawn,
    maxHistoryLength,
    submissions,
  ]);

  const resetGame = useCallback(() => {
    setHandSlots(puzzleData.cards);
    setTableSlots([]);
    setSubmissions([]);
    setFoundDusk(false);
    setFoundDawn(false);
    setAttempts(0);
    setHints({ dusk: [], dawn: [], activeTarget: null });
  }, [puzzleData.cards]);

  return {
    handCards,
    arrangementCards,
    handSlots,
    tableSlots,
    difficulty,
    puzzleCards: puzzleData.cards,
    puzzleResult: puzzleData.puzzleResult,
    foundDusk,
    foundDawn,
    attempts,
    currentResult,
    rawResult,
    isComplete,
    submissions,
    hints,
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
    revealNextHint,
    resumeHints,
    clearHints,
    clearNonHintedCards,
    getHintedCards,
    isHintedCard,
  };
}
