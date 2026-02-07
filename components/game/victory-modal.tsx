"use client";

import { useEffect, useCallback, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Card, Difficulty, SharePreset } from "@/lib/types/game";
import type { Submission } from "@/lib/hooks/use-game";
import { MiniCard } from "./submission-history";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { generateShareMessage, getPresetLabel } from "@/lib/share-messages";

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

/** Generate share text from winning submissions */
function generateShareText(
  duskSubmission: Submission,
  dawnSubmission: Submission,
  attempts: number
): string {
  const formatEquation = (sub: Submission) =>
    sub.arrangement
      .map((c, i) =>
        i === 0 ? `${c.value}` : `${OPERATOR_DISPLAY[c.operator]}${c.value}`
      )
      .join(" ");

  return `Zero Rush 🌅 ${
    attempts === 2 ? "- Two for Two! 🎯" : "- Good Job! 🎉"
  }

🔵 Dusk: ${duskSubmission.result}
${formatEquation(duskSubmission)} = ${duskSubmission.result}

🟡 Dawn: ${dawnSubmission.result}
${formatEquation(dawnSubmission)} = ${dawnSubmission.result}

Found both targets in ${attempts} ${attempts === 1 ? "attempt" : "attempts"}!`;
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
  /** The winning dusk submission */
  duskSubmission?: Submission;
  /** The winning dawn submission */
  dawnSubmission?: Submission;
  /** Current difficulty level */
  difficulty?: Difficulty;
  /** The original puzzle cards (for sharing) */
  puzzleCards?: Card[];
}

const SHARE_PRESETS: SharePreset[] = ["challenge", "teaser", "wordle"];

export function VictoryModal({
  isOpen,
  onClose,
  attempts,
  duskValue,
  dawnValue,
  onNewPuzzle,
  duskSubmission,
  dawnSubmission,
  difficulty = "medium",
  puzzleCards,
}: VictoryModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<SharePreset>("challenge");

  // Generate share text based on selected preset
  const updateShareText = useCallback(
    (preset: SharePreset) => {
      if (!puzzleCards || puzzleCards.length === 0) {
        // Fallback to old style if no puzzle cards
        if (duskSubmission && dawnSubmission) {
          setShareText(generateShareText(duskSubmission, dawnSubmission, attempts));
        }
        return;
      }

      const message = generateShareMessage(preset, {
        cards: puzzleCards,
        difficulty,
        duskValue,
        dawnValue,
        foundDusk: !!duskSubmission,
        foundDawn: !!dawnSubmission,
        attempts,
        duskArrangement: duskSubmission?.arrangement,
        dawnArrangement: dawnSubmission?.arrangement,
      });
      setShareText(message);
    },
    [puzzleCards, difficulty, duskValue, dawnValue, duskSubmission, dawnSubmission, attempts]
  );

  // Initialize share text when modal opens
  useEffect(() => {
    if (isOpen) {
      updateShareText(selectedPreset);
      setIsEditing(false);
      setCopied(false);
    }
  }, [isOpen, selectedPreset, updateShareText]);

  // Update share text when preset changes
  const handlePresetChange = useCallback(
    (preset: SharePreset) => {
      setSelectedPreset(preset);
      updateShareText(preset);
      setIsEditing(false);
    },
    [updateShareText]
  );

  // Trigger canvas confetti when modal opens - initial burst + 2 more after 1s each
  useEffect(() => {
    if (isOpen) {
      fireConfetti();
      // Second burst after 1 second
      const timer1 = setTimeout(() => fireConfetti(), 1000);
      // Third burst after 2 seconds
      const timer2 = setTimeout(() => fireConfetti(), 2000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const handleTwitterShare = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled or share failed
      }
    }
  }, [shareText]);

  if (!isOpen) return null;

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

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
            "max-w-md w-full p-8 max-h-[90vh] overflow-y-auto",
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
          <div className="flex justify-center gap-6 mb-4">
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

          {/* Winning Equations */}
          {duskSubmission && dawnSubmission && (
            <div className="flex flex-col gap-2 mb-6">
              {/* Dusk equation */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/30">
                <span className="text-sky-600 dark:text-sky-400">🔵</span>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {duskSubmission.arrangement.map((card, index) => (
                    <MiniCard key={index} card={card} isFirst={index === 0} />
                  ))}
                </div>
                <span className="text-muted-foreground">=</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {duskSubmission.result}
                </span>
              </div>

              {/* Dawn equation */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="text-amber-600 dark:text-amber-400">🟡</span>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {dawnSubmission.arrangement.map((card, index) => (
                    <MiniCard key={index} card={card} isFirst={index === 0} />
                  ))}
                </div>
                <span className="text-muted-foreground">=</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {dawnSubmission.result}
                </span>
              </div>
            </div>
          )}

          {/* Share Section */}
          {duskSubmission && dawnSubmission && (
            <div className="mb-6">
              <div className="border-t border-border pt-4">
                {/* Share preset selector */}
                {puzzleCards && puzzleCards.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground text-center mb-2">
                      Share as challenge
                    </div>
                    <div className="flex gap-1 p-1 rounded-lg bg-muted">
                      {SHARE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handlePresetChange(preset)}
                          className={cn(
                            "flex-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                            selectedPreset === preset
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {getPresetLabel(preset)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share buttons */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
                      "border border-input bg-background hover:bg-accent transition-colors",
                      copied &&
                        "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-input bg-background hover:bg-accent transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  {canShare && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-input bg-background hover:bg-accent transition-colors"
                    >
                      <ShareIcon className="w-4 h-4" />
                      <span>More</span>
                    </button>
                  )}
                </div>

                {/* Edit toggle */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <EditIcon className="w-3 h-3" />
                  <span>{isEditing ? "Hide editor" : "Edit message"}</span>
                </button>

                {/* Editable textarea */}
                {isEditing && (
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    className="mt-3 w-full h-40 p-3 rounded-lg bg-muted/50 border border-border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
              </div>
            </div>
          )}

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

function ClipboardIcon({ className }: { className?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
