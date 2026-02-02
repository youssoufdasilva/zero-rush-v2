/**
 * Share message generator for puzzle sharing
 *
 * Provides 3 preset formats:
 * - Challenge: "Can you solve this?" with difficulty and link
 * - Teaser: Shows the dusk/dawn values as a hint
 * - Wordle: Compact format showing what was found
 */

import type { Card, Difficulty, SharePreset } from "./types/game";
import { getShareUrl } from "./puzzle-url";
import { OPERATOR_DISPLAY } from "./game/constants";

export interface ShareMessageOptions {
  cards: Card[];
  difficulty: Difficulty;
  duskValue: number;
  dawnValue: number;
  foundDusk: boolean;
  foundDawn: boolean;
  attempts: number;
  duskArrangement?: Card[];
  dawnArrangement?: Card[];
  /** Hints used during this puzzle session */
  hintsUsed?: {
    dusk: number;
    dawn: number;
    total: number;
  };
}

/**
 * Format a card arrangement as an equation string
 */
function formatEquation(arrangement: Card[]): string {
  return arrangement
    .map((c, i) =>
      i === 0 ? `${c.value}` : `${OPERATOR_DISPLAY[c.operator]}${c.value}`
    )
    .join(" ");
}

/**
 * Get a label for difficulty
 */
function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    easy: "4 cards",
    medium: "6 cards",
    hard: "8 cards",
    challenger: "10 cards",
  };
  return labels[difficulty];
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a share message using the Challenge preset
 *
 * Format:
 * "Can you solve this Zero Rush puzzle?
 * 6 cards - Medium difficulty
 * [link]"
 */
export function generateChallengeMessage(options: ShareMessageOptions): string {
  const { cards, difficulty } = options;
  const url = getShareUrl(cards, difficulty);
  const cardLabel = getDifficultyLabel(difficulty);

  return `Can you solve this Zero Rush puzzle?\n${cardLabel} - ${capitalize(
    difficulty
  )} difficulty\n${url}`;
}

/**
 * Generate a share message using the Teaser preset
 *
 * Format:
 * "I found dusk (3) and dawn (42) - can you?
 * [link]"
 */
export function generateTeaserMessage(options: ShareMessageOptions): string {
  const {
    cards,
    difficulty,
    duskValue,
    dawnValue,
    foundDusk,
    foundDawn,
    hintsUsed,
  } = options;
  const url = getShareUrl(cards, difficulty);

  const parts: string[] = [];

  const hintsNote =
    hintsUsed && hintsUsed.total > 0
      ? ` (with ${hintsUsed.total} hint${hintsUsed.total === 1 ? "" : "s"})`
      : "";

  if (foundDusk && foundDawn) {
    parts.push(
      `I found dusk (${duskValue}) and dawn (${dawnValue})${hintsNote} - can you?`
    );
  } else if (foundDusk) {
    parts.push(
      `I found dusk (${duskValue})${hintsNote} - can you find dawn too?`
    );
  } else if (foundDawn) {
    parts.push(
      `I found dawn (${dawnValue})${hintsNote} - can you find dusk too?`
    );
  } else {
    parts.push(`Can you find dusk and dawn?`);
  }

  parts.push(url);

  return parts.join("\n");
}

/**
 * Generate a share message using the Wordle-style preset
 *
 * Format:
 * "Zero Rush
 * Dusk ✔️ | Dawn ✔️
 * Attempts: 5 (2 hints)
 * [link]"
 */
export function generateWordleMessage(options: ShareMessageOptions): string {
  const { cards, difficulty, foundDusk, foundDawn, attempts, hintsUsed } =
    options;
  const url = getShareUrl(cards, difficulty);

  const duskStatus = foundDusk ? "✔️" : "❌";
  const dawnStatus = foundDawn ? "✔️" : "❌";

  const hintsText =
    hintsUsed && hintsUsed.total > 0
      ? ` (${hintsUsed.total} hint${hintsUsed.total === 1 ? "" : "s"})`
      : "";

  return `Zero Rush\nDusk ${duskStatus} | Dawn ${dawnStatus}\nAttempts: ${attempts}${hintsText}\n${url}`;
}

/**
 * Generate a share message for the specified preset
 */
export function generateShareMessage(
  preset: SharePreset,
  options: ShareMessageOptions
): string {
  switch (preset) {
    case "challenge":
      return generateChallengeMessage(options);
    case "teaser":
      return generateTeaserMessage(options);
    case "wordle":
      return generateWordleMessage(options);
    default:
      return generateChallengeMessage(options);
  }
}

/**
 * Get a label for a share preset
 */
export function getPresetLabel(preset: SharePreset): string {
  const labels: Record<SharePreset, string> = {
    challenge: "Challenge",
    teaser: "Teaser",
    wordle: "Wordle",
  };
  return labels[preset];
}

/**
 * Get a description for a share preset
 */
export function getPresetDescription(preset: SharePreset): string {
  const descriptions: Record<SharePreset, string> = {
    challenge: "Invite friends to try the puzzle",
    teaser: "Hint at the targets to intrigue them",
    wordle: "Compact format showing your results",
  };
  return descriptions[preset];
}
