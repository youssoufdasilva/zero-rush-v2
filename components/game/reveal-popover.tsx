"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface RevealPopoverProps {
  /** Whether the popover is open */
  isOpen: boolean;
  /** Close the popover */
  onClose: () => void;
  /** The target being revealed (dusk or dawn) */
  target: "dusk" | "dawn";
  /** Current number of revealed hints for this target */
  revealedCount: number;
  /** Total number of cards in the puzzle */
  totalCards: number;
  /** Maximum hints allowed (based on settings) */
  maxHints: number;
  /** Callback when user confirms reveal of next card */
  onReveal: () => void;
  /** Callback when user wants to resume/switch to this target without revealing more */
  onResume: () => void;
  /** Whether this target's hints are currently displayed on the table */
  isActiveTarget: boolean;
}

export function RevealPopover({
  isOpen,
  onClose,
  target,
  revealedCount,
  totalCards,
  maxHints,
  onReveal,
  onResume,
  isActiveTarget,
}: RevealPopoverProps) {
  const [showLearnMore, setShowLearnMore] = useState(false);

  if (!isOpen) return null;

  const isDusk = target === "dusk";
  const isFirstReveal = revealedCount === 0;
  const isAtMax = revealedCount >= maxHints;
  const remainingHints = maxHints - revealedCount;
  const hasProgressButNotActive = revealedCount > 0 && !isActiveTarget;

  const handleReveal = () => {
    onReveal();
    // Don't close automatically - let user reveal more or close manually
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Popover */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[320px] max-w-[90vw]",
          "bg-card border rounded-xl shadow-xl z-50",
          "animate-in fade-in zoom-in-95 duration-200",
          // Theme border
          isDusk ? "border-sky-500/50" : "border-amber-500/50"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            isDusk
              ? "border-sky-500/30 bg-sky-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <h2
            className={cn(
              "font-semibold",
              isDusk
                ? "text-sky-600 dark:text-sky-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            Reveal {isDusk ? "Dusk" : "Dawn"} Solution
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isFirstReveal ? (
            // First time reveal confirmation
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reveal your first hint? This will show the first card of the{" "}
                {isDusk ? "dusk" : "dawn"} solution in its correct position.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReveal}
                  className={cn(
                    isDusk
                      ? "bg-sky-500 hover:bg-sky-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  )}
                >
                  Reveal
                </Button>
              </div>
            </div>
          ) : hasProgressButNotActive ? (
            // Has progress but not active - show Resume button to switch target
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <span
                  className={cn(
                    "font-medium",
                    isDusk
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {revealedCount} of {totalCards} cards
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isDusk ? "bg-sky-500" : "bg-amber-500"
                  )}
                  style={{ width: `${(revealedCount / totalCards) * 100}%` }}
                />
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You have {revealedCount} hint{revealedCount !== 1 ? "s" : ""}{" "}
                saved for {isDusk ? "dusk" : "dawn"}.
              </p>

              {/* Resume button - switches back without revealing more */}
              <Button
                variant="outline"
                className={cn(
                  "w-full",
                  isDusk
                    ? "border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                    : "border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                )}
                onClick={onResume}
              >
                Resume with Current Hints
              </Button>

              {/* Reveal more button - only if not at max */}
              {!isAtMax && (
                <Button
                  className={cn(
                    "w-full",
                    isDusk
                      ? "bg-sky-500 hover:bg-sky-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  )}
                  onClick={handleReveal}
                >
                  Reveal Next Card
                  <span className="ml-2 text-xs opacity-80">
                    ({remainingHints} remaining)
                  </span>
                </Button>
              )}
            </div>
          ) : (
            // Active and has progress - show reveal more button
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <span
                  className={cn(
                    "font-medium",
                    isDusk
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {revealedCount} of {totalCards} cards
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isDusk ? "bg-sky-500" : "bg-amber-500"
                  )}
                  style={{ width: `${(revealedCount / totalCards) * 100}%` }}
                />
              </div>

              {isAtMax ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Maximum hints reached ({maxHints} of {totalCards})
                </p>
              ) : (
                <Button
                  className={cn(
                    "w-full",
                    isDusk
                      ? "bg-sky-500 hover:bg-sky-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  )}
                  onClick={handleReveal}
                >
                  Reveal Next Card
                  <span className="ml-2 text-xs opacity-80">
                    ({remainingHints} remaining)
                  </span>
                </Button>
              )}
            </div>
          )}

          {/* Learn about reveals - collapsible */}
          <div className="border-t pt-3 mt-3">
            <button
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronIcon
                className={cn(
                  "w-4 h-4 transition-transform",
                  showLearnMore && "rotate-90"
                )}
              />
              Learn about reveals
            </button>

            {showLearnMore && (
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground pl-6">
                <li className="list-disc">
                  Reveals are tracked in your history and when sharing puzzles
                </li>
                <li className="list-disc">
                  You can reveal up to {maxHints} cards (half of {totalCards})
                </li>
                <li className="list-disc">
                  Switching between dusk and dawn clears current hints, but your
                  progress is saved
                </li>
                <li className="list-disc">
                  Tap &quot;Clear Hint&quot; to remove hints and regain full
                  control
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
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

function ChevronIcon({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
