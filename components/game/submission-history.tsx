"use client";

import { useState } from "react";
import type { Card } from "@/lib/types/game";
import type { Submission } from "@/lib/hooks/use-game";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

export interface SubmissionHistoryProps {
  /** List of submissions (newest first) */
  submissions: Submission[];
  /** Dusk target value */
  duskValue: number;
  /** Dawn target value */
  dawnValue: number;
}

export function SubmissionHistory({ 
  submissions, 
  duskValue, 
  dawnValue 
}: SubmissionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Always render container for fixed layout
  return (
    <div className="flex flex-col gap-1 w-full max-w-sm">
      {submissions.length > 0 ? (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronIcon className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
            <span>History ({submissions.length})</span>
          </button>
          
          {isExpanded && (
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-muted/20 border border-border/50 max-h-[150px] overflow-y-auto">
              {submissions.map((submission) => (
                <SubmissionEntry
                  key={submission.id}
                  submission={submission}
                  duskValue={duskValue}
                  dawnValue={dawnValue}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Empty placeholder for fixed height
        <div className="h-6" />
      )}
    </div>
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface SubmissionEntryProps {
  submission: Submission;
  duskValue: number;
  dawnValue: number;
}

function SubmissionEntry({ submission, duskValue, dawnValue }: SubmissionEntryProps) {
  const { arrangement, result, isDusk, isDawn, isInvalid } = submission;
  
  // Determine the color coding
  const getColorClass = () => {
    if (isInvalid) return "bg-red-500/10 border-red-500/30";
    if (isDusk) return "bg-sky-500/10 border-sky-500/30";
    if (isDawn) return "bg-amber-500/10 border-amber-500/30";
    return "bg-muted/30 border-transparent";
  };

  // Format result for display
  const displayResult = Number.isInteger(result) ? result : result.toFixed(2);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-1.5 px-2 py-1 rounded border text-xs",
        getColorClass()
      )}
    >
      {/* Mini card display */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {arrangement.map((card, index) => (
          <MiniCard key={index} card={card} isFirst={index === 0} />
        ))}
      </div>
      
      {/* Result */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-muted-foreground">=</span>
        <span className={cn(
          "font-semibold tabular-nums",
          isInvalid && "text-red-600 dark:text-red-400",
          isDusk && "text-sky-600 dark:text-sky-400",
          isDawn && "text-amber-600 dark:text-amber-400",
          !isInvalid && !isDusk && !isDawn && "text-muted-foreground"
        )}>
          {displayResult}
        </span>
      </div>
    </div>
  );
}

export function MiniCard({ card, isFirst }: { card: Card; isFirst: boolean }) {
  const operatorSymbol = OPERATOR_DISPLAY[card.operator];
  
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "px-1 py-0.5 rounded text-[10px] font-medium",
        "bg-card/50 border",
        card.operator === "+" && "border-emerald-500/30",
        card.operator === "-" && "border-rose-500/30",
        card.operator === "*" && "border-violet-500/30",
        card.operator === "÷" && "border-amber-500/30"
      )}
    >
      <span className={cn(
        "text-[10px]",
        card.operator === "+" && "text-emerald-600 dark:text-emerald-400",
        card.operator === "-" && "text-rose-600 dark:text-rose-400",
        card.operator === "*" && "text-violet-600 dark:text-violet-400",
        card.operator === "÷" && "text-amber-600 dark:text-amber-400",
        isFirst && "opacity-40"
      )}>
        {operatorSymbol}
      </span>
      <span className="text-[10px]">{card.value}</span>
    </span>
  );
}

