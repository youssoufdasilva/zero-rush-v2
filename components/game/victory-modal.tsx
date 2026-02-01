"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Confetti colors for canvas-confetti
const CONFETTI_COLORS = [
  "#38bdf8", // sky-400
  "#f59e0b", // amber-500
  "#a855f7", // violet-500
  "#10b981", // emerald-500
  "#f43f5e", // rose-500
  "#3b82f6", // blue-500
];

/** Fire confetti burst using canvas-confetti (GPU-accelerated) */
function fireConfetti() {
  // Center burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6, x: 0.5 },
    colors: CONFETTI_COLORS,
  });

  // Side bursts for extra flair
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: CONFETTI_COLORS,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: CONFETTI_COLORS,
    });
  }, 150);
}

export interface VictoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Number of attempts taken */
  attempts: number;
  /** Dusk value found */
  duskValue: number;
  /** Dawn value found */
  dawnValue: number;
  /** Callback to start a new puzzle */
  onNewPuzzle: () => void;
}

export function VictoryModal({
  isOpen,
  onClose,
  attempts,
  duskValue,
  dawnValue,
  onNewPuzzle,
}: VictoryModalProps) {
  // Trigger canvas confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop - fully opaque */}
      <div
        className="fixed inset-0 bg-background/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal content - solid background */}
        <div
          className={cn(
            "relative bg-card border-2 border-primary/50 rounded-2xl shadow-2xl",
            "max-w-md w-full p-8",
            "animate-in fade-in zoom-in-95 duration-300"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Trophy icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <TrophyIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-sky-500 via-primary to-amber-500 bg-clip-text text-transparent">
            Puzzle Complete!
          </h2>

          {/* Stats */}
          <p className="text-center text-muted-foreground mb-6">
            Found both targets in{" "}
            <span className="font-bold text-foreground">{attempts}</span>{" "}
            {attempts === 1 ? "attempt" : "attempts"}
          </p>

          {/* Target values */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Dusk
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {duskValue}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Dawn
              </span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {dawnValue}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Keep Playing
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onNewPuzzle();
                onClose();
              }}
            >
              New Puzzle
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export interface VictoryBannerProps {
  /** Whether victory has been achieved */
  isComplete: boolean;
  /** Callback when banner is clicked */
  onClick: () => void;
  /** Number of attempts taken */
  attempts: number;
}

export function VictoryBanner({
  isComplete,
  onClick,
  attempts,
}: VictoryBannerProps) {
  const handleClick = useCallback(() => {
    // Trigger canvas confetti
    fireConfetti();
    onClick();
  }, [onClick]);

  // Thinner banner container - 40px instead of 52px
  return (
    <div className="h-10 w-full flex items-center justify-center my-4">
      {isComplete ? (
        <button
          onClick={handleClick}
          className={cn(
            "relative overflow-hidden",
            "px-4 py-1.5 rounded-lg",
            "bg-linear-to-r from-sky-500/20 via-primary/20 to-amber-500/20",
            "border border-primary/40",
            "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20",
            "transition-all duration-200",
            "group"
          )}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />

          <div className="relative flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold bg-linear-to-r from-sky-600 via-primary to-amber-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-amber-400">
              Puzzle Complete!
            </span>
            <span className="text-xs text-muted-foreground">({attempts})</span>
          </div>
        </button>
      ) : (
        // Empty placeholder to maintain height
        <div className="h-full" />
      )}
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
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
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
