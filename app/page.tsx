"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/types/game";
import { GameBoard } from "@/components/game";
import { HomeScreen } from "@/components/game/home-screen";

export default function Page() {
  const [gameState, setGameState] = useState<
    { playing: false } | { playing: true; difficulty: Difficulty }
  >({
    playing: false,
  });

  const handleStart = (difficulty: Difficulty) => {
    setGameState({ playing: true, difficulty });
  };

  const handleBack = () => {
    setGameState({ playing: false });
  };

  return (
    <main className="min-h-screen">
      {gameState.playing ? (
        <GameBoard difficulty={gameState.difficulty} onBack={handleBack} />
      ) : (
        <HomeScreen onStart={handleStart} />
      )}
    </main>
  );
}
