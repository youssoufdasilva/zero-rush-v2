"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export interface CardSlotProps {
  id: string;
  children?: React.ReactNode;
  isOver?: boolean;
  /** Whether this slot is empty (no card) */
  isEmpty?: boolean;
  /** Size variant */
  size?: "normal" | "small" | "hand";
  /** Click handler for empty slot */
  onClick?: () => void;
}

export function CardSlot({
  id,
  children,
  isOver: isOverProp,
  isEmpty = false,
  size = "normal",
  onClick,
}: CardSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const showHover = isOver || isOverProp;
  const isSmall = size === "small";
  const isHand = size === "hand";

  return (
    <div
      ref={setNodeRef}
      onClick={isEmpty && onClick ? onClick : undefined}
      className={cn(
        "flex items-center justify-center shrink-0",
        "rounded-xl border-2 border-dashed",
        "transition-all duration-200",
        // Size variants
        isSmall && "w-11 h-14 sm:w-14 sm:h-18",
        isHand && "w-12 h-15 sm:w-14 sm:h-18",
        !isSmall && !isHand && "w-16 h-20 sm:w-20 sm:h-24",
        // Empty state styling
        isEmpty
          ? "bg-muted/20 border-muted-foreground/20 shadow-inner"
          : "border-transparent",
        // Hover state
        showHover && "border-primary bg-primary/10 scale-105",
        // Clickable empty slot
        isEmpty && onClick && "cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30"
      )}
    >
      {children}
    </div>
  );
}
