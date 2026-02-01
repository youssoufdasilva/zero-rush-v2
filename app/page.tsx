"use client";

import { useState } from "react";
import type { Card, Difficulty } from "@/lib/types/game";
import { GameBoard } from "@/components/game";
import { HomeScreen } from "@/components/game/home-screen";
import { PuzzleHistory } from "@/components/game/puzzle-history";

type PageState =
  | { screen: "home" }
  | { screen: "playing"; difficulty: Difficulty; providedCards?: Card[] }
  | { screen: "history" };

export default function Page() {
  const [pageState, setPageState] = useState<PageState>({ screen: "home" });

  const handleStart = (difficulty: Difficulty) => {
    setPageState({ screen: "playing", difficulty });
  };

  const handleBack = () => {
    setPageState({ screen: "home" });
  };

  const handleHistory = () => {
    setPageState({ screen: "history" });
  };

  const handleResolve = (cards: Card[], difficulty: Difficulty) => {
    setPageState({ screen: "playing", difficulty, providedCards: cards });
  };

  return (
    <main className="min-h-screen">
      {pageState.screen === "playing" ? (
        <GameBoard
          difficulty={pageState.difficulty}
          onBack={handleBack}
          providedCards={pageState.providedCards}
          puzzleSource={pageState.providedCards ? "shared" : "generated"}
        />
      ) : pageState.screen === "history" ? (
        <PuzzleHistory onBack={handleBack} onResolve={handleResolve} />
      ) : (
        <HomeScreen onStart={handleStart} onHistory={handleHistory} />
      )}
    </main>
  );
}
