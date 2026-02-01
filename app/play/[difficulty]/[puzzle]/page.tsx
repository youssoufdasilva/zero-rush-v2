import { notFound } from "next/navigation";
import { decodePuzzleFromUrl } from "@/lib/puzzle-url";
import { SharedPuzzleGame } from "@/components/game/shared-puzzle-game";

interface PlayPageProps {
  params: Promise<{
    difficulty: string;
    puzzle: string;
  }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { difficulty, puzzle } = await params;

  // Decode and validate the puzzle from URL
  const decodedPuzzle = decodePuzzleFromUrl(difficulty, puzzle);

  if (!decodedPuzzle) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <SharedPuzzleGame
        cards={decodedPuzzle.cards}
        difficulty={decodedPuzzle.difficulty}
        signature={decodedPuzzle.signature}
        duskValue={decodedPuzzle.duskValue}
        dawnValue={decodedPuzzle.dawnValue}
      />
    </main>
  );
}

export function generateMetadata({ params }: { params: Promise<{ difficulty: string; puzzle: string }> }) {
  return params.then(({ difficulty }) => ({
    title: `Zero Rush - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Puzzle`,
    description: "Can you solve this Zero Rush puzzle? Find the lowest and highest values!",
  }));
}
