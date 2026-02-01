"use client";

import { useCallback, useState } from "react";
import type { PuzzleHistoryEntry, SharePreset } from "@/lib/types/game";
import { cn } from "@/lib/utils";
import { generateShareMessage } from "@/lib/share-messages";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";

export interface PuzzleHistoryItemProps {
  entry: PuzzleHistoryEntry;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onResolve: (entry: PuzzleHistoryEntry) => void;
}

/**
 * Format a date relative to now
 */
function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) {
    return "Just now";
  }
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `${mins}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }
  if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function PuzzleHistoryItem({
  entry,
  onToggleFavorite,
  onDelete,
  onResolve,
}: PuzzleHistoryItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const message = generateShareMessage("challenge", {
      cards: entry.cards,
      difficulty: entry.difficulty,
      duskValue: entry.duskValue,
      dawnValue: entry.dawnValue,
      foundDusk: entry.foundDusk,
      foundDawn: entry.foundDawn,
      attempts: entry.attempts,
    });

    try {
      if (navigator.share) {
        await navigator.share({ text: message });
      } else {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or share failed - copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore clipboard failures
      }
    }
  }, [entry]);

  const handleResolve = useCallback(() => {
    onResolve(entry);
  }, [entry, onResolve]);

  const handleDelete = useCallback(() => {
    onDelete(entry.id);
  }, [entry.id, onDelete]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(entry.id);
  }, [entry.id, onToggleFavorite]);

  return (
    <div
      className={cn(
        "relative group",
        "p-3 rounded-xl border bg-card",
        "hover:border-primary/50 transition-colors"
      )}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Main content row */}
      <div className="flex items-center gap-3">
        {/* Favorite star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite();
          }}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg",
            "transition-colors",
            entry.isFavorite
              ? "text-amber-500"
              : "text-muted-foreground hover:text-amber-500"
          )}
          title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {entry.isFavorite ? (
            <StarFilledIcon className="w-5 h-5" />
          ) : (
            <StarIcon className="w-5 h-5" />
          )}
        </button>

        {/* Puzzle info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {entry.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.cards.length} cards
            </span>
            {entry.source === "shared" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                Shared
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm">
            {/* Dusk/Dawn values */}
            <span
              className={cn(
                "flex items-center gap-1",
                entry.foundDusk
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-muted-foreground"
              )}
            >
              <span>Dusk</span>
              <span className="font-mono font-medium">{entry.duskValue}</span>
              {entry.foundDusk && <CheckIcon className="w-3 h-3" />}
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                entry.foundDawn
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              <span>Dawn</span>
              <span className="font-mono font-medium">{entry.dawnValue}</span>
              {entry.foundDawn && <CheckIcon className="w-3 h-3" />}
            </span>
          </div>
        </div>

        {/* Attempts and date */}
        <div className="text-right text-sm">
          <div className="text-muted-foreground">
            {entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeDate(entry.completedAt)}
          </div>
        </div>
      </div>

      {/* Mini cards preview */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {entry.cards.slice(0, 6).map((card, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono rounded bg-muted"
          >
            {OPERATOR_DISPLAY[card.operator]}
            {card.value}
          </span>
        ))}
        {entry.cards.length > 6 && (
          <span className="text-xs text-muted-foreground self-center">
            +{entry.cards.length - 6} more
          </span>
        )}
      </div>

      {/* Action buttons (shown on click/hover) */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
              "bg-muted hover:bg-muted/80 transition-colors",
              copied && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            )}
          >
            <ShareIcon className="w-4 h-4" />
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResolve();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80 transition-colors"
          >
            <RefreshIcon className="w-4 h-4" />
            <span>Re-solve</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Icons
function StarIcon({ className }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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

function TrashIcon({ className }: { className?: string }) {
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
