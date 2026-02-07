"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export interface GameControlsProps {
  /** Called when user clicks Submit */
  onSubmit: () => void;
  /** Called when user clicks Clear */
  onClear: () => void;
  /** Called when user clicks New Puzzle */
  onNewPuzzle: () => void;
  /** Number of attempts made */
  attempts: number;
  /** Whether game is complete (both targets found) */
  isComplete: boolean;
  /** Whether submit is allowed (all cards placed, valid result) */
  canSubmit: boolean;
  /** Whether there are cards in arrangement to clear */
  hasArrangement: boolean;
  /** Whether auto-submit is enabled */
  autoSubmit?: boolean;
  /** Auto-submit delay in ms */
  autoSubmitDelay?: number;
}

export function GameControls({
  onSubmit,
  onClear,
  onNewPuzzle,
  attempts,
  isComplete,
  canSubmit,
  hasArrangement,
  autoSubmit = false,
  autoSubmitDelay = 500,
}: GameControlsProps) {
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCanSubmitRef = useRef(canSubmit);

  // Auto-submit logic
  useEffect(() => {
    // Only trigger auto-submit when canSubmit changes from false to true
    if (autoSubmit && canSubmit && !prevCanSubmitRef.current && !isComplete) {
      // Clear any existing timer
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
      
      // Set up auto-submit timer
      autoSubmitTimerRef.current = setTimeout(() => {
        onSubmit();
      }, autoSubmitDelay);
    }

    prevCanSubmitRef.current = canSubmit;

    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, [autoSubmit, canSubmit, isComplete, onSubmit, autoSubmitDelay]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Victory message */}
      {isComplete && (
        <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500/20 via-primary/20 to-amber-500/20 border border-primary/30">
          <div className="text-lg font-bold text-center bg-gradient-to-r from-sky-600 via-primary to-amber-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-primary dark:to-amber-400">
            Puzzle Complete!
          </div>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Found both dusk and dawn in {attempts} {attempts === 1 ? "attempt" : "attempts"}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onClear}
          variant="outline"
          size="lg"
          disabled={!hasArrangement || isComplete}
          className="min-w-[100px]"
        >
          Clear
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isComplete}
          size="lg"
          className="min-w-[100px]"
        >
          Submit
        </Button>
        
        <Button
          onClick={onNewPuzzle}
          variant="outline"
          size="lg"
          className="min-w-[120px]"
        >
          New Puzzle
        </Button>
      </div>

      {/* Attempts counter */}
      {attempts > 0 && !isComplete && (
        <div className="text-sm text-muted-foreground">
          Attempts: <span className="font-medium tabular-nums">{attempts}</span>
        </div>
      )}
    </div>
  );
}
