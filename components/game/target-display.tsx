"use client";

import { cn } from "@/lib/utils";

export interface TargetDisplayProps {
  /** The target type */
  type: "dusk" | "dawn";
  /** The target value */
  value: number;
  /** Whether this target has been found */
  found: boolean;
  /** Whether to show the target value (hidden by default for gameplay) */
  showValue?: boolean;
}

export function TargetDisplay({ type, value, found, showValue = false }: TargetDisplayProps) {
  const isDusk = type === "dusk";
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl min-w-[120px]",
        "border-2 transition-all duration-300",
        // Dusk styling (blue/sky)
        isDusk && !found && "border-sky-500/30 bg-sky-500/5",
        isDusk && found && "border-sky-500 bg-sky-500/20 shadow-lg shadow-sky-500/20",
        // Dawn styling (amber/gold)  
        !isDusk && !found && "border-amber-500/30 bg-amber-500/5",
        !isDusk && found && "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20"
      )}
    >
      {/* Label */}
      <div
        className={cn(
          "text-sm font-semibold uppercase tracking-wider",
          isDusk ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
        )}
      >
        {isDusk ? "Dusk" : "Dawn"}
        <span className="ml-1 text-xs font-normal opacity-70">
          ({isDusk ? "lowest" : "highest"})
        </span>
      </div>

      {/* Target value - hidden until found or showValue is true */}
      <div
        className={cn(
          "text-4xl sm:text-5xl font-bold tabular-nums transition-all",
          isDusk ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400",
          found && "scale-110"
        )}
      >
        {found || showValue ? value : "?"}
      </div>

      {/* Found indicator - just a checkmark icon when found */}
      {found && (
        <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
          <CheckIcon className="w-4 h-4" />
          <span>Found!</span>
        </div>
      )}
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
