"use client";

import { useState, useMemo } from "react";
import type { PuzzleHistoryEntry, Difficulty } from "@/lib/types/game";
import { usePuzzleHistory } from "@/lib/hooks/use-puzzle-history";
import { PuzzleHistoryItem } from "./puzzle-history-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PuzzleHistoryProps {
  onBack: () => void;
  onResolve: (cards: PuzzleHistoryEntry["cards"], difficulty: Difficulty) => void;
}

type Tab = "all" | "favorites";

export function PuzzleHistory({ onBack, onResolve }: PuzzleHistoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const { entries, favorites, toggleFavorite, deleteEntry, isLoading } =
    usePuzzleHistory();

  const displayedEntries = useMemo(
    () => (activeTab === "favorites" ? favorites : entries),
    [activeTab, entries, favorites]
  );

  const handleResolve = (entry: PuzzleHistoryEntry) => {
    onResolve(entry.cards, entry.difficulty);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Puzzle History</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 mx-4 mt-4 rounded-lg bg-muted">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "favorites"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {activeTab === "favorites" ? (
              <>
                <StarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No favorites yet</p>
                <p className="text-sm text-muted-foreground">
                  Star puzzles you want to revisit or share with friends
                </p>
              </>
            ) : (
              <>
                <HistoryIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No puzzle history</p>
                <p className="text-sm text-muted-foreground">
                  Completed puzzles will appear here
                </p>
                <Button onClick={onBack} className="mt-4">
                  Play a puzzle
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedEntries.map((entry) => (
              <PuzzleHistoryItem
                key={entry.id}
                entry={entry}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteEntry}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      {entries.length > 0 && (
        <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
          {entries.length} / 100 puzzles saved
        </div>
      )}
    </div>
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
