"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/types/game";
import { OPERATOR_DISPLAY } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

export interface GameCardProps {
  card: Card;
  id: string;
  isFirst?: boolean;
  disabled?: boolean;
  /** Whether drag is enabled (true for arrangement cards) */
  draggable?: boolean;
  /** Click handler for tap interaction */
  onClick?: () => void;
  /** Size variant */
  size?: "normal" | "small" | "hand";
  /** Position number for hinted cards (1, 2, 3...) - undefined = not a hint */
  hintPosition?: number;
  /** Theme color for hint badge and glow */
  hintTheme?: "dusk" | "dawn";
}

export function GameCard({
  card,
  id,
  isFirst = false,
  disabled = false,
  draggable = true,
  onClick,
  size = "normal",
  hintPosition,
  hintTheme,
}: GameCardProps) {
  const isHinted = hintPosition !== undefined;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disabled || !draggable || isHinted });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: draggable && !isHinted ? ("none" as const) : undefined,
  };

  const operatorSymbol = OPERATOR_DISPLAY[card.operator];
  const isSmall = size === "small";
  const isHand = size === "hand";

  // Hinted cards are locked - no interaction
  const effectiveDisabled = disabled || isHinted;
  const effectiveDraggable = draggable && !isHinted;

  const handleClick = (e: React.MouseEvent) => {
    // Hinted cards cannot be clicked
    if (isHinted) {
      e.stopPropagation();
      return;
    }
    // Only trigger click if not dragging and onClick is provided
    if (!isDragging && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(effectiveDraggable ? listeners : {})}
      onClick={handleClick}
      data-dnd-draggable={effectiveDraggable || undefined}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "rounded-xl border-2 shadow-lg",
        "bg-card text-card-foreground",
        "select-none",
        "transition-all duration-150",
        // Size variants - minimum 44px (w-11) for touch targets
        isSmall && "w-11 h-14 sm:w-14 sm:h-18",
        isHand && "w-12 h-15 sm:w-14 sm:h-18",
        !isSmall && !isHand && "w-16 h-20 sm:w-20 sm:h-24",
        // Cursor based on interaction mode
        effectiveDraggable &&
          !effectiveDisabled &&
          "cursor-grab active:cursor-grabbing",
        onClick &&
          !effectiveDraggable &&
          !effectiveDisabled &&
          "cursor-pointer hover:scale-105 hover:shadow-xl",
        onClick && effectiveDraggable && !effectiveDisabled && "cursor-pointer",
        // Operator-based coloring (override for hinted cards)
        !isHinted &&
          card.operator === "+" &&
          "border-emerald-500 dark:border-emerald-400",
        !isHinted &&
          card.operator === "-" &&
          "border-rose-500 dark:border-rose-400",
        !isHinted &&
          card.operator === "*" &&
          "border-violet-500 dark:border-violet-400",
        !isHinted &&
          card.operator === "÷" &&
          "border-amber-500 dark:border-amber-400",
        // Hint theme styling (overrides operator coloring)
        isHinted &&
          hintTheme === "dusk" &&
          "border-sky-500 ring-2 ring-sky-500/30 shadow-sky-500/20",
        isHinted &&
          hintTheme === "dawn" &&
          "border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/20",
        // States
        isDragging &&
          "opacity-70 scale-110 shadow-2xl z-50 ring-2 ring-primary/50",
        effectiveDisabled && !isHinted && "opacity-60 cursor-not-allowed",
        isHinted && "cursor-not-allowed"
      )}
    >
      {/* Hint position badge - top left */}
      {isHinted && hintPosition && (
        <div
          className={cn(
            "absolute -top-2 -left-2 flex items-center justify-center",
            "w-5 h-5 rounded-full text-[10px] font-bold",
            "shadow-sm",
            hintTheme === "dusk" && "bg-sky-500 text-white",
            hintTheme === "dawn" && "bg-amber-500 text-white"
          )}
        >
          {hintPosition}
        </div>
      )}

      {/* Operator indicator - always show */}
      <div
        className={cn(
          "font-bold leading-none",
          isSmall && "text-xl sm:text-2xl",
          isHand && "text-lg sm:text-xl",
          !isSmall && !isHand && "text-xl sm:text-2xl",
          // Muted on first card since operator is ignored in evaluation
          isFirst ? "text-muted-foreground/40" : "text-foreground",
          // Normal operator colors (unless hinted)
          !isHinted &&
            card.operator === "+" &&
            "text-emerald-600 dark:text-emerald-400",
          !isHinted &&
            card.operator === "-" &&
            "text-rose-600 dark:text-rose-400",
          !isHinted &&
            card.operator === "*" &&
            "text-violet-600 dark:text-violet-400",
          !isHinted &&
            card.operator === "÷" &&
            "text-amber-600 dark:text-amber-400",
          // Hinted card operator color follows theme
          isHinted && hintTheme === "dusk" && "text-sky-600 dark:text-sky-400",
          isHinted &&
            hintTheme === "dawn" &&
            "text-amber-600 dark:text-amber-400",
          isFirst && "opacity-50"
        )}
      >
        {operatorSymbol}
      </div>

      {/* Number */}
      <div
        className={cn(
          "font-bold tabular-nums",
          isSmall && "text-lg sm:text-xl",
          isHand && "text-base sm:text-lg",
          !isSmall && !isHand && "text-2xl sm:text-3xl"
        )}
      >
        {card.value}
      </div>
    </div>
  );
}

/** Static version for display (non-draggable) */
export function StaticCard({
  card,
  isFirst = false,
}: {
  card: Card;
  isFirst?: boolean;
}) {
  const operatorSymbol = OPERATOR_DISPLAY[card.operator];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        "w-10 h-12 sm:w-12 sm:h-14",
        "rounded-lg border-2 shadow-sm",
        "bg-card text-card-foreground",
        // Operator-based coloring
        card.operator === "+" &&
          "border-emerald-500/50 dark:border-emerald-400/50",
        card.operator === "-" && "border-rose-500/50 dark:border-rose-400/50",
        card.operator === "*" &&
          "border-violet-500/50 dark:border-violet-400/50",
        card.operator === "÷" && "border-amber-500/50 dark:border-amber-400/50"
      )}
    >
      <div
        className={cn(
          "text-sm font-semibold leading-none",
          card.operator === "+" && "text-emerald-600 dark:text-emerald-400",
          card.operator === "-" && "text-rose-600 dark:text-rose-400",
          card.operator === "*" && "text-violet-600 dark:text-violet-400",
          card.operator === "÷" && "text-amber-600 dark:text-amber-400",
          isFirst && "opacity-50"
        )}
      >
        {operatorSymbol}
      </div>
      <div className="text-lg font-bold tabular-nums">{card.value}</div>
    </div>
  );
}
