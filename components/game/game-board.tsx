"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import type {
  Difficulty,
  AutoOrgMode,
  Card,
  HintMode,
  MaxHintLimit,
} from "@/lib/types/game";
import { useGame } from "@/lib/hooks/use-game";
import {
  usePuzzleHistory,
  createHistoryEntry,
} from "@/lib/hooks/use-puzzle-history";
import { GameCard } from "./game-card";
import { Hand } from "./hand";
import { TargetDisplay } from "./target-display";
import { SettingsDialog } from "./settings-dialog";
import { SubmissionHistory } from "./submission-history";
import { VictoryModal, VictoryBanner } from "./victory-modal";
import { SlotGrid } from "./slot-grid";
import { RevealPopover } from "./reveal-popover";
import { cardToString } from "@/lib/game/evaluate";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/lib/hooks/use-sound-effects";

export interface GameSettings {
  showTargetValues: boolean;
  hintMode: HintMode;
  autoSubmit: boolean;
  maxHistoryLength: number;
  highlightMatches: boolean;
  clearAfterSubmit: boolean;
  controlsStyle: "text-icons" | "icons-only";
  historyPlacement: "inline" | "drawer";
  soundEffects: boolean;
  useCardSlots: boolean;
  autoOrganization: AutoOrgMode;
  enableHandDrag: boolean;
  autoSaveHistory: boolean;
  maxHintLimit: MaxHintLimit;
}

const DEFAULT_SETTINGS: GameSettings = {
  showTargetValues: false,
  hintMode: "reveals",
  autoSubmit: false,
  maxHistoryLength: 10,
  highlightMatches: false,
  clearAfterSubmit: true,
  controlsStyle: "text-icons",
  historyPlacement: "drawer",
  soundEffects: true,
  useCardSlots: true,
  autoOrganization: "hand",
  enableHandDrag: false,
  autoSaveHistory: true,
  maxHintLimit: "half",
};

function getInitialSettings(difficulty: Difficulty): GameSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_SETTINGS,
      hintMode: difficulty === "challenger" ? "disabled" : "reveals",
    };
  }
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return {
        ...DEFAULT_SETTINGS,
        hintMode: difficulty === "challenger" ? "disabled" : "reveals",
      };
    }
    const parsed = JSON.parse(stored) as Partial<GameSettings> & {
      showDirectionalHints?: boolean;
    };
    if (parsed && typeof parsed === "object") {
      // Migrate from old showDirectionalHints to new hintMode
      if (
        parsed.hintMode === undefined &&
        parsed.showDirectionalHints !== undefined
      ) {
        parsed.hintMode = parsed.showDirectionalHints ? "reveals" : "disabled";
      }
      // If hintMode not explicitly set and Challenger, default to disabled
      if (parsed.hintMode === undefined && difficulty === "challenger") {
        parsed.hintMode = "disabled";
      }
      // Set default maxHintLimit if not present
      if (parsed.maxHintLimit === undefined) {
        parsed.maxHintLimit = "half";
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return {
    ...DEFAULT_SETTINGS,
    hintMode: difficulty === "challenger" ? "disabled" : "reveals",
  };
};
const SETTINGS_STORAGE_KEY = "zero-rush.gameSettings";

export interface GameBoardProps {
  /** Selected difficulty level */
  difficulty: Difficulty;
  /** Callback to go back to home screen */
  onBack: () => void;
  /** Provided cards (for shared puzzles) */
  providedCards?: Card[];
  /** Source of the puzzle */
  puzzleSource?: "generated" | "shared";
  /** URL the puzzle was shared from */
  sharedFromUrl?: string;
}

export function GameBoard({
  difficulty,
  onBack,
  providedCards,
  puzzleSource = "generated",
  sharedFromUrl,
}: GameBoardProps) {
  const [settings, setSettings] = useState<GameSettings>(() => getInitialSettings(difficulty));
  const [showVictoryModal, setShowVictoryModal] = useState(isComplete);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shakeSubmit, setShakeSubmit] = useState(false);
  const [flashHistory, setFlashHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [revealPopoverTarget, setRevealPopoverTarget] = useState<
    "dusk" | "dawn" | null
  >(null);
  const [pulseClearButton, setPulseClearButton] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCanSubmitRef = useRef(false);
  const prevCompleteRef = useRef(false);

  const { play } = useSoundEffects(settings.soundEffects);
  const { addEntry: addHistoryEntry } = usePuzzleHistory();
  const historySavedRef = useRef(false);

  const {
    handCards,
    arrangementCards,
    handSlots,
    tableSlots,
    puzzleCards,
    puzzleResult,
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
    canSubmit,
    setMaxHistoryLength,
    cardCount,
    setAutoOrgMode,
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
  } = useGame({ difficulty, providedCards });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track completion state changes via ref to avoid setState in effect cascade
  if (isComplete && !prevCompleteRef.current) {
    prevCompleteRef.current = true;
    // Use microtask to avoid synchronous setState during render cascade
    queueMicrotask(() => setShowVictoryModal(true));
  } else if (!isComplete) {
    prevCompleteRef.current = false;
  }

  // Save to history when puzzle is completed
  useEffect(() => {
    if (isComplete && settings.autoSaveHistory && !historySavedRef.current) {
      historySavedRef.current = true;

      const duskSubmission = submissions.find((s) => s.isDusk);
      const dawnSubmission = submissions.find((s) => s.isDawn);

      const entry = createHistoryEntry({
        cards: puzzleCards,
        difficulty,
        attempts,
        duskValue: puzzleResult.dusk.result,
        dawnValue: puzzleResult.dawn.result,
        foundDusk,
        foundDawn,
        duskSubmission: duskSubmission
          ? {
              arrangement: duskSubmission.arrangement,
              result: duskSubmission.result,
            }
          : undefined,
        dawnSubmission: dawnSubmission
          ? {
              arrangement: dawnSubmission.arrangement,
              result: dawnSubmission.result,
            }
          : undefined,
        source: puzzleSource,
        sharedFromUrl,
        hintsUsed: {
          dusk: hints.dusk.length,
          dawn: hints.dawn.length,
          total: hints.dusk.length + hints.dawn.length,
        },
      });

      addHistoryEntry(entry);
    }
  }, [
    isComplete,
    settings.autoSaveHistory,
    puzzleCards,
    difficulty,
    attempts,
    puzzleResult.dusk.result,
    puzzleResult.dawn.result,
    foundDusk,
    foundDawn,
    submissions,
    puzzleSource,
    sharedFromUrl,
    addHistoryEntry,
    hints,
  ]);

  // Reset history saved flag when generating new puzzle
  useEffect(() => {
    historySavedRef.current = false;
  }, [puzzleCards]);

  // Sync settings with hook
  useEffect(() => {
    setMaxHistoryLength(settings.maxHistoryLength);
  }, [settings.maxHistoryLength, setMaxHistoryLength]);

  useEffect(() => {
    setAutoOrgMode(settings.autoOrganization);
  }, [settings.autoOrganization, setAutoOrgMode]);

  useEffect(() => {
    setUseCardSlots(settings.useCardSlots);
  }, [settings.useCardSlots, setUseCardSlots]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }, [settings]);

  // Create unique IDs for arrangement cards
  const arrangementCardIds = useMemo(
    () =>
      arrangementCards.map(
        (card, index) => `arrangement-${cardToString(card)}-${index}`
      ),
    [arrangementCards]
  );

  // Compute best attempts for target progress display
  const bestAttempts = useMemo(() => {
    const validSubmissions = submissions.filter((s) => !s.isInvalid);
    if (validSubmissions.length === 0) return { lowest: null, highest: null };

    const values = validSubmissions.map((s) => s.result);
    return {
      lowest: Math.min(...values),
      highest: Math.max(...values),
    };
  }, [submissions]);

  // Calculate max hints based on settings
  const maxHints = useMemo(() => {
    if (settings.maxHintLimit === "all") {
      return Math.max(cardCount - 2, 1); // Nearly all (n-2), min 1
    }
    return Math.floor(cardCount / 2); // Half the cards
  }, [cardCount, settings.maxHintLimit]);

  // Get hinted cards for display
  const hintedCards = useMemo(() => getHintedCards(), [getHintedCards]);

  // Whether hints are currently active
  const hasActiveHints = hints.activeTarget !== null && hintedCards.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = arrangementCardIds.indexOf(active.id as string);
      const newIndex = arrangementCardIds.indexOf(over.id as string);
      const newCards = arrayMove(arrangementCards, oldIndex, newIndex);
      reorderArrangement(newCards);
    }
  }

  const handleSubmit = useCallback(() => {
    const result = submitAttempt();

    if (result.isDuplicate) {
      // Trigger shake and flash animations
      setShakeSubmit(true);
      setFlashHistory(true);
      play("duplicate");

      // Reset animations after they complete
      setTimeout(() => setShakeSubmit(false), 500);
      setTimeout(() => setFlashHistory(false), 600);
      return;
    }

    if (result.value === null) {
      play("submitInvalid");
    } else {
      play("submitValid");
    }

    if (result.isDusk) {
      play("duskFound");
    }

    if (result.isDawn) {
      play("dawnFound");
    }

    const completesPuzzle =
      (foundDusk || result.isDusk) && (foundDawn || result.isDawn);

    // Clear arrangement after successful submit if setting is enabled
    if (settings.clearAfterSubmit && !completesPuzzle) {
      if (hasActiveHints) {
        // Only remove non-hinted cards from table
        clearNonHintedCards();
      } else {
        clearArrangement();
      }
    }
  }, [
    submitAttempt,
    settings.clearAfterSubmit,
    foundDusk,
    foundDawn,
    clearArrangement,
    clearNonHintedCards,
    hasActiveHints,
    play,
  ]);

  const handleAddCard = useCallback(
    (card: Card) => {
      play("cardAdd");
      addToArrangement(card);
    },
    [addToArrangement, play]
  );

  const handleRemoveCard = useCallback(
    (card: Card) => {
      play("cardRemove");
      removeFromArrangement(card);
    },
    [removeFromArrangement, play]
  );

  // Slot-based handlers
  const handleHandSlotClick = useCallback(
    (index: number) => {
      const card = handSlots[index];
      if (card) {
        play("cardAdd");
        addToTableAtSlot(index);
      }
    },
    [handSlots, addToTableAtSlot, play]
  );

  const handleTableSlotClick = useCallback(
    (index: number) => {
      const card = tableSlots[index];
      if (card) {
        play("cardRemove");
        removeFromTableAtSlot(index);
      }
    },
    [tableSlots, removeFromTableAtSlot, play]
  );

  const handleTableSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      swapWithinTable(fromIndex, toIndex);
    },
    [swapWithinTable]
  );

  const handleHandSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      swapWithinHand(fromIndex, toIndex);
    },
    [swapWithinHand]
  );

  const handleClear = useCallback(() => {
    // If hints are active, first clear hints
    if (hasActiveHints) {
      play("clear");
      clearHints();
      return;
    }
    // Normal clear behavior
    if (arrangementCards.length === 0) return;
    play("clear");
    clearArrangement();
  }, [
    arrangementCards.length,
    clearArrangement,
    play,
    hasActiveHints,
    clearHints,
  ]);

  const handleNewPuzzle = useCallback(() => {
    play("newPuzzle");
    generateNewPuzzle();
    setRevealPopoverTarget(null);
  }, [generateNewPuzzle, play]);

  // Handle reveal popover actions
  const handleRevealClick = useCallback(
    (target: "dusk" | "dawn") => {
      if (settings.hintMode !== "reveals") return;
      setRevealPopoverTarget(target);
    },
    [settings.hintMode]
  );

  const handleReveal = useCallback(() => {
    if (!revealPopoverTarget) return;
    revealNextHint(revealPopoverTarget);
  }, [revealPopoverTarget, revealNextHint]);

  const handleResume = useCallback(() => {
    if (!revealPopoverTarget) return;
    resumeHints(revealPopoverTarget);
    setRevealPopoverTarget(null);
  }, [revealPopoverTarget, resumeHints]);

  // Handle attempted interaction with hinted card
  const handleHintedCardInteraction = useCallback(() => {
    // Pulse the clear button to indicate user should clear hints first
    setPulseClearButton(true);
    setTimeout(() => setPulseClearButton(false), 600);
  }, []);

  // Auto-submit when enabled and ready
  useEffect(() => {
    if (!settings.autoSubmit) {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = null;
      }
      prevCanSubmitRef.current = canSubmit;
      return;
    }

    if (canSubmit && !prevCanSubmitRef.current && !isComplete) {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
      autoSubmitTimerRef.current = setTimeout(() => {
        handleSubmit();
      }, 500);
    }

    prevCanSubmitRef.current = canSubmit;

    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, [settings.autoSubmit, canSubmit, isComplete, handleSubmit]);

  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      play("puzzleComplete");
      prevCompleteRef.current = true;
      return;
    }
    if (!isComplete) {
      prevCompleteRef.current = false;
    }
  }, [isComplete, play]);

  // Build equation display string (first card shows just number, no operator)
  const equationDisplay = arrangementCards
    .map((card, i) => {
      const op = OPERATOR_DISPLAY[card.operator];
      if (i === 0) return `${card.value}`;
      return ` ${op} ${card.value}`;
    })
    .join("");

  // Determine if current result is invalid (negative or non-integer)
  const isInvalidResult =
    rawResult !== null && (rawResult < 0 || !Number.isInteger(rawResult));

  // Format the display result
  const displayResult =
    rawResult !== null
      ? Number.isInteger(rawResult)
        ? rawResult
        : rawResult.toFixed(2)
      : null;

  // Determine result styling
  const getResultClassName = () => {
    if (rawResult === null) return "bg-muted text-muted-foreground";
    if (isInvalidResult) return "bg-red-500/20 text-red-600 dark:text-red-400";

    // Only highlight matches if setting is enabled
    if (settings.highlightMatches) {
      if (currentResult === puzzleResult.dusk.result && !foundDusk) {
        return "bg-sky-500/20 text-sky-600 dark:text-sky-400";
      }
      if (currentResult === puzzleResult.dawn.result && !foundDawn) {
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
      }
    }

    return "bg-muted text-foreground";
  };

  // Scale cards for 8+ cards on desktop
  const shouldScaleCards = cardCount >= 8 && !isMobile;

  return (
    <>
      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        attempts={attempts}
        duskValue={puzzleResult.dusk.result}
        dawnValue={puzzleResult.dawn.result}
        onNewPuzzle={handleNewPuzzle}
        duskSubmission={submissions.find((s) => s.isDusk)}
        dawnSubmission={submissions.find((s) => s.isDawn)}
        difficulty={difficulty}
        puzzleCards={puzzleCards}
      />

      {/* Reveal Popover */}
      {revealPopoverTarget && (
        <RevealPopover
          isOpen={true}
          onClose={() => setRevealPopoverTarget(null)}
          target={revealPopoverTarget}
          revealedCount={hints[revealPopoverTarget].length}
          totalCards={cardCount}
          maxHints={maxHints}
          onReveal={handleReveal}
          onResume={handleResume}
          isActiveTarget={hints.activeTarget === revealPopoverTarget}
        />
      )}

      {/* History Drawer (when in drawer mode) */}
      {settings.historyPlacement === "drawer" && (
        <HistoryDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          submissions={submissions}
          flashHistory={flashHistory}
        />
      )}

      <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 min-h-svh">
        {/* Header with back button and settings */}
        <div className="flex items-center justify-between w-full mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Zero Rush
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {settings.historyPlacement === "drawer" && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className={cn(
                  "relative flex items-center justify-center",
                  "h-10 w-10 rounded-lg border border-input bg-background",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
                style={
                  flashHistory
                    ? { animation: "flash-pulse 0.3s ease-in-out 2" }
                    : undefined
                }
                title="History"
              >
                <HistoryIcon className="w-5 h-5" />
                {submissions.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                    {submissions.length}
                  </span>
                )}
              </button>
            )}
            <SettingsDialog
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>
        </div>

        {/* Target displays - fixed height zone */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full min-h-[110px]">
          <TargetDisplay
            type="dusk"
            value={puzzleResult.dusk.result}
            found={foundDusk}
            showValue={settings.showTargetValues}
            bestAttempt={bestAttempts.lowest}
            hintMode={settings.hintMode}
            hintCount={hints.dusk.length}
            maxHints={maxHints}
            onRevealClick={() => handleRevealClick("dusk")}
          />
          <TargetDisplay
            type="dawn"
            value={puzzleResult.dawn.result}
            found={foundDawn}
            showValue={settings.showTargetValues}
            bestAttempt={bestAttempts.highest}
            hintMode={settings.hintMode}
            hintCount={hints.dawn.length}
            maxHints={maxHints}
            onRevealClick={() => handleRevealClick("dawn")}
          />
        </div>

        {/* Victory Banner - fixed height zone */}
        <VictoryBanner
          isComplete={isComplete}
          onClick={() => setShowVictoryModal(true)}
          attempts={attempts}
        />

        {/* Inline History - fixed height zone */}
        {settings.historyPlacement === "inline" && (
          <div
            className="w-full max-w-sm min-h-[80px] mb-4"
            style={
              flashHistory
                ? { animation: "flash-pulse 0.3s ease-in-out 2" }
                : undefined
            }
          >
            <SubmissionHistory
              submissions={submissions}
            />
          </div>
        )}

        {/* Arrangement area - fixed height zone */}
        <div className="flex flex-col items-center gap-3 w-full shrink-0">
          <div className="text-sm font-medium text-muted-foreground">
            Arrangement (drag to reorder, tap to remove):
          </div>

          {settings.useCardSlots ? (
            /* Slot-based rendering */
            <div
              className={cn(
                "p-3 sm:p-4 rounded-2xl border w-full transition-all duration-300",
                shouldScaleCards
                  ? "min-h-[80px]"
                  : "min-h-[100px] sm:min-h-[120px]",
                // Theme based on active hint target
                hints.activeTarget === "dusk" &&
                  "bg-sky-500/10 border-sky-500/50",
                hints.activeTarget === "dawn" &&
                  "bg-amber-500/10 border-amber-500/50",
                !hints.activeTarget && "bg-muted/30 border-border"
              )}
            >
              <SlotGrid
                slots={tableSlots}
                totalSlots={cardCount}
                zone="table"
                onSlotClick={handleTableSlotClick}
                onDragEnd={!isComplete ? handleTableSwap : undefined}
                disabled={isComplete}
                isTableZone={true}
                size={shouldScaleCards ? "small" : "hand"}
                hintedCards={hintedCards}
                onHintedCardInteraction={handleHintedCardInteraction}
              />
            </div>
          ) : (
            /* Legacy flex-based rendering */
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={arrangementCardIds}
                strategy={horizontalListSortingStrategy}
              >
                <div
                  className={cn(
                    "flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-muted/30 border w-full flex-wrap justify-center",
                    shouldScaleCards
                      ? "min-h-[80px]"
                      : "min-h-[100px] sm:min-h-[120px]"
                  )}
                >
                  {arrangementCards.length === 0 ? (
                    <span className="text-sm text-muted-foreground self-center">
                      Tap cards below to add them here
                    </span>
                  ) : (
                    arrangementCards.map((card, index) => (
                      <GameCard
                        key={arrangementCardIds[index]}
                        id={arrangementCardIds[index]}
                        card={card}
                        isFirst={index === 0}
                        disabled={isComplete}
                        draggable={true}
                        onClick={() => handleRemoveCard(card)}
                        size={shouldScaleCards ? "small" : "normal"}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Equation display with auto-calculated result */}
          <div className="flex items-center gap-2 text-base sm:text-lg min-h-[28px]">
            {arrangementCards.length > 0 && (
              <>
                <span className="font-mono text-muted-foreground">
                  {equationDisplay}
                </span>
                <span className="text-muted-foreground">=</span>
                <span
                  className={cn(
                    "font-bold tabular-nums px-2 py-0.5 rounded",
                    getResultClassName()
                  )}
                >
                  {displayResult ?? "?"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Game controls */}
        <div className="w-full flex justify-center mb-4">
          <GameControlsCompact
            onSubmit={handleSubmit}
            onClear={handleClear}
            onNewPuzzle={handleNewPuzzle}
            attempts={attempts}
            isComplete={isComplete}
            canSubmit={canSubmit}
            hasArrangement={arrangementCards.length > 0}
            controlsStyle={settings.controlsStyle}
            shakeSubmit={shakeSubmit}
            hasActiveHints={hasActiveHints}
            hintTheme={hints.activeTarget}
            pulseClearButton={pulseClearButton}
            ref={submitButtonRef}
          />
        </div>

        {/* Spacer to push hand to bottom */}
        <div className="flex-1 min-h-1" />

        {/* Hand area at bottom - fixed height zone */}
        <div
          className={cn(
            "w-full",
            shouldScaleCards ? "min-h-[70px]" : "min-h-[100px]"
          )}
        >
          <Hand
            cards={handCards}
            onCardTap={handleAddCard}
            disabled={isComplete}
            size={shouldScaleCards ? "small" : "hand"}
            slots={settings.useCardSlots ? handSlots : undefined}
            totalSlots={settings.useCardSlots ? cardCount : undefined}
            useSlots={settings.useCardSlots}
            onSlotClick={handleHandSlotClick}
            onSwapSlots={settings.enableHandDrag ? handleHandSwap : undefined}
          />
        </div>
      </div>
    </>
  );
}

// Compact controls component for the new layout
interface GameControlsCompactProps {
  onSubmit: () => void;
  onClear: () => void;
  onNewPuzzle: () => void;
  attempts: number;
  isComplete: boolean;
  canSubmit: boolean;
  hasArrangement: boolean;
  controlsStyle: "text-icons" | "icons-only";
  shakeSubmit: boolean;
  hasActiveHints: boolean;
  hintTheme: "dusk" | "dawn" | null;
  pulseClearButton: boolean;
}

const GameControlsCompact = ({
  onSubmit,
  onClear,
  onNewPuzzle,
  attempts,
  isComplete,
  canSubmit,
  hasArrangement,
  controlsStyle,
  shakeSubmit,
  hasActiveHints,
  hintTheme,
  pulseClearButton,
}: GameControlsCompactProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const showText = controlsStyle === "text-icons";

  // Clear button can be activated when there's arrangement OR active hints
  const clearEnabled = (hasArrangement || hasActiveHints) && !isComplete;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClear}
        disabled={!clearEnabled}
        className={cn(
          "flex items-center justify-center gap-1.5",
          "h-10 px-3 rounded-lg border transition-all",
          // Default styling
          !hasActiveHints &&
            "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          // Hint mode styling - themed background
          hasActiveHints &&
            hintTheme === "dusk" &&
            "border-sky-500 bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/30",
          hasActiveHints &&
            hintTheme === "dawn" &&
            "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
        style={
          pulseClearButton
            ? { animation: "pulse 0.3s ease-in-out 2" }
            : undefined
        }
        title={hasActiveHints ? "Clear Hint" : "Clear"}
      >
        <ClearIcon className="w-4 h-4" />
        {showText && (
          <span className="text-sm">
            {hasActiveHints ? "Clear Hint" : "Clear"}
          </span>
        )}
      </button>

      <button
        onClick={onNewPuzzle}
        className={cn(
          "flex items-center justify-center gap-1.5",
          "h-10 px-3 rounded-lg border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-colors"
        )}
        title="New Puzzle"
      >
        <NewPuzzleIcon className="w-4 h-4" />
        {showText && <span className="text-sm">New</span>}
      </button>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || isComplete}
        className={cn(
          "flex items-center justify-center gap-1.5",
          "h-10 px-4 rounded-lg bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "disabled:opacity-50 disabled:pointer-events-none",
          "transition-colors"
        )}
        style={
          shakeSubmit ? { animation: "shake 0.5s ease-in-out" } : undefined
        }
        title="Submit"
      >
        <SubmitIcon className="w-4 h-4" />
        {showText && <span className="text-sm font-medium">Submit</span>}
      </button>

      {/* Attempts counter */}
      {attempts > 0 && !isComplete && (
        <div className="text-sm text-muted-foreground ml-2">
          <span className="font-medium tabular-nums">{attempts}</span>
        </div>
      )}
    </div>
  );
};

// History Drawer component
interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: ReturnType<typeof useGame>["submissions"];
  flashHistory: boolean;
}

function HistoryDrawer({
  isOpen,
  onClose,
  submissions,
  flashHistory,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-80 max-w-[85vw]",
          "bg-card border-l border-border shadow-xl z-50",
          "animate-in slide-in-from-right duration-300"
        )}
        style={
          flashHistory
            ? { animation: "flash-pulse 0.3s ease-in-out 2" }
            : undefined
        }
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">History ({submissions.length})</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No submissions yet
              </p>
            ) : (
              <SubmissionHistory
                submissions={submissions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Icons
function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    </svg>
  );
}

function SubmitIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function NewPuzzleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8v4l3 3M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
