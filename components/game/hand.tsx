"use client";

import type { Card, Slot } from "@/lib/types/game";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { SlotGrid } from "./slot-grid";

export interface HandProps {
  /** Cards available in hand */
  cards: Card[];
  /** Callback when a card is tapped */
  onCardTap: (card: Card) => void;
  /** Whether interactions are disabled */
  disabled?: boolean;
  /** Card size variant */
  size?: "normal" | "small" | "hand";
  /** Whether to enable horizontal scrolling instead of wrapping */
  scrollable?: boolean;
  /** Slot-based rendering */
  slots?: Slot[];
  /** Total number of slots for slot-based rendering */
  totalSlots?: number;
  /** Whether to use slot-based rendering */
  useSlots?: boolean;
  /** Callback when a slot is clicked (for slot-based rendering) */
  onSlotClick?: (index: number) => void;
  /** Callback for swapping slots (drag and drop) */
  onSwapSlots?: (fromIndex: number, toIndex: number) => void;
}

export function Hand({
  cards,
  onCardTap,
  disabled = false,
  size = "normal",
  scrollable = false,
  slots,
  totalSlots,
  useSlots = false,
  onSlotClick,
  onSwapSlots,
}: HandProps) {
  const isSmall = size === "small";

  // Slot-based rendering mode
  if (useSlots && slots && totalSlots !== undefined && onSlotClick) {
    const hasCards = slots.some((s) => s !== null);

    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="text-sm font-medium text-muted-foreground">
          {hasCards ? "Tap a card to add it:" : "All cards placed"}
        </div>
        <div
          className={cn(
            "p-4 rounded-2xl bg-muted/20 border border-border/50 w-full",
            isSmall ? "min-h-[70px]" : "min-h-[100px]"
          )}
        >
          <SlotGrid
            slots={slots}
            totalSlots={totalSlots}
            zone="hand"
            onSlotClick={onSlotClick}
            onDragEnd={onSwapSlots}
            disabled={disabled}
            size={size}
          />
        </div>
      </div>
    );
  }

  // Legacy flex-based rendering
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
  size?: "normal" | "small" | "hand";
}

function HandCard({
  card,
  onTap,
  disabled = false,
  size = "normal",
}: HandCardProps) {
  const operatorSymbol = OPERATOR_DISPLAY[card.operator];
  const isSmall = size === "small";
  const isHand = size === "hand";

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
        // Size variants - minimum 44px (w-11) for touch targets
        isSmall && "w-11 h-14 sm:w-12 sm:h-16",
        isHand && "w-12 h-15 sm:w-14 sm:h-18",
        !isSmall && !isHand && "w-14 h-18 sm:w-16 sm:h-20",
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
          isSmall && "text-lg sm:text-xl",
          isHand && "text-base sm:text-lg",
          !isSmall && !isHand && "text-lg sm:text-xl",
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
          isSmall && "text-base sm:text-lg",
          isHand && "text-sm sm:text-base",
          !isSmall && !isHand && "text-xl sm:text-2xl"
        )}
      >
        {card.value}
      </div>
    </button>
  );
}
