"use client";

import { useCallback, useState, useEffect } from "react";
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
  const [sharedFromUrl, setSharedFromUrl] = useState<string | undefined>();

  // Capture the URL on client side
  useEffect(() => {
    setSharedFromUrl(window.location.href);
  }, []);

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
