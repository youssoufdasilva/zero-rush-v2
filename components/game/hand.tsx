"use client";

import type { Card } from "@/lib/types/game";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

export interface HandProps {
  /** Cards available in hand */
  cards: Card[];
  /** Callback when a card is tapped */
  onCardTap: (card: Card) => void;
  /** Whether interactions are disabled */
  disabled?: boolean;
  /** Card size variant */
  size?: "normal" | "small";
  /** Whether to enable horizontal scrolling instead of wrapping */
  scrollable?: boolean;
}

export function Hand({
  cards,
  onCardTap,
  disabled = false,
  size = "normal",
  scrollable = false,
}: HandProps) {
  const isSmall = size === "small";

  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-4",
          isSmall ? "min-h-[70px]" : "min-h-[100px]"
        )}
      >
        <span className="text-sm text-muted-foreground">All cards placed</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="text-sm font-medium text-muted-foreground">
        Tap a card to add it:
      </div>
      <div
        className={cn(
          "p-4 rounded-2xl bg-muted/20 border border-border/50",
          isSmall ? "min-h-[70px]" : "min-h-[100px]",
          scrollable
            ? "flex gap-2 sm:gap-3 overflow-x-auto w-full scrollbar-thin"
            : "flex flex-wrap justify-center gap-2 sm:gap-3"
        )}
      >
        {cards.map((card, index) => (
          <HandCard
            key={`hand-${card.operator}${card.value}-${index}`}
            card={card}
            onTap={() => onCardTap(card)}
            disabled={disabled}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}

interface HandCardProps {
  card: Card;
  onTap: () => void;
  disabled?: boolean;
  size?: "normal" | "small";
}

function HandCard({
  card,
  onTap,
  disabled = false,
  size = "normal",
}: HandCardProps) {
  const operatorSymbol = OPERATOR_DISPLAY[card.operator];
  const isSmall = size === "small";

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center shrink-0",
        "rounded-xl border-2 shadow-md",
        "bg-card text-card-foreground",
        "transition-all duration-150",
        "hover:scale-105 hover:shadow-lg",
        "active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        // Size variants
        isSmall ? "w-10 h-14 sm:w-12 sm:h-16" : "w-14 h-18 sm:w-16 sm:h-20",
        // Operator-based coloring
        card.operator === "+" && "border-emerald-500 dark:border-emerald-400",
        card.operator === "-" && "border-rose-500 dark:border-rose-400",
        card.operator === "*" && "border-violet-500 dark:border-violet-400",
        card.operator === "÷" && "border-amber-500 dark:border-amber-400",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      {/* Operator indicator */}
      <div
        className={cn(
          "font-bold leading-none",
          isSmall ? "text-lg sm:text-xl" : "text-lg sm:text-xl",
          card.operator === "+" && "text-emerald-600 dark:text-emerald-400",
          card.operator === "-" && "text-rose-600 dark:text-rose-400",
          card.operator === "*" && "text-violet-600 dark:text-violet-400",
          card.operator === "÷" && "text-amber-600 dark:text-amber-400"
        )}
      >
        {operatorSymbol}
      </div>

      {/* Number */}
      <div
        className={cn(
          "font-bold tabular-nums",
          isSmall ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
        )}
      >
        {card.value}
      </div>
    </button>
  );
}
