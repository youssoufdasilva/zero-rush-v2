"use client";

import type { Difficulty } from "@/lib/types/game";
import { DIFFICULTY_CONFIG } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

export interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "challenger"];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  challenger: "Challenger",
};

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">
        Difficulty
      </label>
      
      <div className="flex flex-wrap gap-1.5">
        {DIFFICULTY_ORDER.map((difficulty) => {
          const config = DIFFICULTY_CONFIG[difficulty];
          const isSelected = value === difficulty;
          
          return (
            <button
              key={difficulty}
              onClick={() => onChange(difficulty)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg",
                "border-2 transition-all duration-200",
                "text-sm font-medium",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted hover:border-muted-foreground/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>{DIFFICULTY_LABELS[difficulty]}</span>
              <span className="text-xs text-muted-foreground">
                {config.cards} cards
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
