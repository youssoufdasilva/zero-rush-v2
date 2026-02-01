"use client";

import { cn } from "@/lib/utils";

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
  /** Whether to show directional arrow hints */
  showHint?: boolean;
}

export function TargetDisplay({
  type,
  value,
  found,
  showValue = false,
  bestAttempt,
  showHint = true,
}: TargetDisplayProps) {
  const isDusk = type === "dusk";
  const ArrowIcon = isDusk ? ChevronDownIcon : ChevronUpIcon;

  // Determine what to display
  const showArrow = showHint && !found && bestAttempt !== null;
  const showPlaceholder = !found && bestAttempt === null;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-xl min-w-[100px]",
        "border-2 transition-all duration-300",
        // Dusk styling (blue/sky)
        isDusk && !found && "border-sky-500/30 bg-sky-500/5",
        isDusk && found && "border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20",
        // Dawn styling (amber/gold)
        !isDusk && !found && "border-amber-500/30 bg-amber-500/5",
        !isDusk && found && "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20"
      )}
    >
      {/* Target value pill - top right */}
      {showValue && !found && (
        <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
          {value}
        </div>
      )}

      {/* Label */}
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          isDusk ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
        )}
      >
        {isDusk ? "Dusk" : "Dawn"}
        <span className="ml-1 text-[10px] font-normal opacity-70">
          ({isDusk ? "lowest" : "highest"})
        </span>
      </div>

      {/* Main display: best attempt + arrow/checkmark */}
      <div
        className={cn(
          "flex items-center gap-1 text-3xl sm:text-4xl font-bold tabular-nums transition-all",
          isDusk ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400",
          found && "scale-110"
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
            {showHint && <ArrowIcon className="w-6 h-6 text-muted-foreground" />}
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
