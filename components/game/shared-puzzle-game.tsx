"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Card, Difficulty } from "@/lib/types/game";
import { GameBoard } from "./game-board";

export interface SharedPuzzleGameProps {
  cards: Card[];
  difficulty: Difficulty;
  signature: string;
  duskValue: number;
  dawnValue: number;
}

/**
 * Client wrapper for GameBoard when playing a shared puzzle.
 * Uses provided cards instead of generating new ones.
 * Tracks source as 'shared' for history.
 */
export function SharedPuzzleGame({
  cards,
  difficulty,
}: SharedPuzzleGameProps) {
  const router = useRouter();
  // Capture URL directly without setState in effect
  const sharedFromUrl = typeof window !== "undefined" ? window.location.href : undefined;

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <GameBoard
      difficulty={difficulty}
      onBack={handleBack}
      providedCards={cards}
      puzzleSource="shared"
      sharedFromUrl={sharedFromUrl}
    />
  );
}
