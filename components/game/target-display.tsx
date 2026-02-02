"use client";

import { cn } from "@/lib/utils";
import type { HintMode } from "@/lib/types/game";

export interface TargetDisplayProps {
  /** The target type */
  type: "dusk" | "dawn";
  /** The target value */
  value: number;
  /** Whether this target has been found */
  found: boolean;
  /** Whether to show the target value in pill (hidden by default for gameplay) */
  showValue?: boolean;
  /** Player's best attempt for this target */
  bestAttempt: number | null;
  /** Whether to show directional arrow hints (deprecated, use hintMode) */
  showHint?: boolean;
  /** How many hints revealed for this target */
  hintCount?: number;
  /** Maximum hints allowed */
  maxHints?: number;
  /** Triggered when user clicks the best attempt area */
  onRevealClick?: () => void;
  /** Hint display mode */
  hintMode?: HintMode;
}

export function TargetDisplay({
  type,
  value,
  found,
  showValue = false,
  bestAttempt,
  showHint = true,
  hintCount = 0,
  maxHints = 0,
  onRevealClick,
  hintMode = "reveals",
}: TargetDisplayProps) {
  const isDusk = type === "dusk";
  const ArrowIcon = isDusk ? ChevronDownIcon : ChevronUpIcon;

  // Determine hint visibility based on mode
  const showDirectionalHints =
    hintMode === "directions" || hintMode === "reveals";
  const showReveals = hintMode === "reveals";

  // Determine what to display
  const showArrow =
    showDirectionalHints && showHint && !found && bestAttempt !== null;
  const showPlaceholder = !found && bestAttempt === null;
  const showQuestionMark = showReveals && showPlaceholder;

  // Whether the best attempt area is clickable
  const isClickable = showReveals && !found && onRevealClick;

  const handleClick = () => {
    if (isClickable && onRevealClick) {
      onRevealClick();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-xl min-w-[100px]",
        "border-2 transition-all duration-300",
        // Dusk styling (blue/sky)
        isDusk && !found && "border-sky-500/30 bg-sky-500/5",
        isDusk &&
          found &&
          "border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20",
        // Dawn styling (amber/gold)
        !isDusk && !found && "border-amber-500/30 bg-amber-500/5",
        !isDusk &&
          found &&
          "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20"
      )}
    >
      {/* Target value pill - top right (larger) */}
      {showValue && !found && (
        <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
          {value}
        </div>
      )}

      {/* Hint progress badge - top left */}
      {showReveals && hintCount > 0 && !found && (
        <div
          className={cn(
            "absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            isDusk
              ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}
        >
          {hintCount}/{maxHints}
        </div>
      )}

      {/* Label */}
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          isDusk
            ? "text-sky-600 dark:text-sky-400"
            : "text-amber-600 dark:text-amber-400"
        )}
      >
        {isDusk ? "Dusk" : "Dawn"}
        <span className="ml-1 text-[10px] font-normal opacity-70">
          ({isDusk ? "lowest" : "highest"})
        </span>
      </div>

      {/* Main display: best attempt + arrow/checkmark/question mark */}
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1 text-3xl sm:text-4xl font-bold tabular-nums transition-all",
          isDusk
            ? "text-sky-600 dark:text-sky-400"
            : "text-amber-600 dark:text-amber-400",
          found && "scale-110",
          isClickable && "cursor-pointer hover:opacity-80 active:scale-95"
        )}
      >
        {found ? (
          <>
            <span>{value}</span>
            <CheckIcon className="w-6 h-6 text-green-500" />
          </>
        ) : showPlaceholder ? (
          <>
            <span className="text-muted-foreground">--</span>
            {showQuestionMark ? (
              <QuestionIcon className="w-6 h-6 text-muted-foreground" />
            ) : showDirectionalHints && showHint ? (
              <ArrowIcon className="w-6 h-6 text-muted-foreground" />
            ) : null}
          </>
        ) : (
          <>
            <span>{bestAttempt}</span>
            {showArrow && <ArrowIcon className="w-6 h-6" />}
          </>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
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
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
