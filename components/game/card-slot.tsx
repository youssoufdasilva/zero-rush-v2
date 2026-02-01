"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export interface CardSlotProps {
  id: string;
  children?: React.ReactNode;
  isOver?: boolean;
}

export function CardSlot({ id, children, isOver: isOverProp }: CardSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  const showHover = isOver || isOverProp;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-center",
        "w-16 h-20 sm:w-20 sm:h-24",
        "rounded-xl border-2 border-dashed",
        "transition-all duration-200",
        showHover
          ? "border-primary bg-primary/10 scale-105"
          : "border-muted-foreground/30 bg-muted/30"
      )}
    >
      {children}
    </div>
  );
}
