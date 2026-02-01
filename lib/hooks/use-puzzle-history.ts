"use client";

import { useState, useCallback, useEffect } from "react";
import type { Card, Difficulty, PuzzleHistoryEntry, HistorySubmission } from "@/lib/types/game";
import { toCanonicalSignature } from "@/lib/game/signature";

const HISTORY_STORAGE_KEY = "zero-rush.puzzleHistory";
const MAX_HISTORY_SIZE = 100;

export interface PuzzleHistorySettings {
  autoSave: boolean;
}

const DEFAULT_SETTINGS: PuzzleHistorySettings = {
  autoSave: true,
};

export interface UsePuzzleHistoryReturn {
  /** All history entries */
  entries: PuzzleHistoryEntry[];
  /** Only favorited entries */
  favorites: PuzzleHistoryEntry[];
  /** Add a new entry to history */
  addEntry: (entry: Omit<PuzzleHistoryEntry, "id">) => string;
  /** Toggle favorite status of an entry */
  toggleFavorite: (id: string) => void;
  /** Delete an entry from history */
  deleteEntry: (id: string) => void;
  /** Get a specific entry by ID */
  getEntry: (id: string) => PuzzleHistoryEntry | undefined;
  /** Get entry by signature (for duplicate detection) */
  getEntryBySignature: (signature: string) => PuzzleHistoryEntry | undefined;
  /** History settings */
  settings: PuzzleHistorySettings;
  /** Update history settings */
  updateSettings: (settings: Partial<PuzzleHistorySettings>) => void;
  /** Whether history is loading from storage */
  isLoading: boolean;
}

/**
 * Generate a unique ID for a history entry
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing puzzle history with localStorage persistence
 */
export function usePuzzleHistory(): UsePuzzleHistoryReturn {
  const [entries, setEntries] = useState<PuzzleHistoryEntry[]>([]);
  const [settings, setSettings] = useState<PuzzleHistorySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      }
    } catch {
      // Ignore malformed storage
    }
    setIsLoading(false);
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage failures
    }
  }, [entries, isLoading]);

  // Computed: favorites only
  const favorites = entries.filter((e) => e.isFavorite);

  const addEntry = useCallback(
    (entry: Omit<PuzzleHistoryEntry, "id">): string => {
      const id = generateId();
      const newEntry: PuzzleHistoryEntry = { ...entry, id };

      setEntries((prev) => {
        // Check for duplicate by signature - merge if found
        const existingIndex = prev.findIndex((e) => e.signature === entry.signature);
        if (existingIndex !== -1) {
          // Merge: keep favorite status, update other fields
          const existing = prev[existingIndex];
          const merged: PuzzleHistoryEntry = {
            ...newEntry,
            id: existing.id,
            isFavorite: existing.isFavorite,
            // Merge submissions (add new ones that aren't duplicates)
            submissions: [
              ...existing.submissions,
              ...entry.submissions.filter(
                (s) =>
                  !existing.submissions.some(
                    (es) =>
                      es.result === s.result &&
                      es.isDusk === s.isDusk &&
                      es.isDawn === s.isDawn
                  )
              ),
            ],
          };
          const newEntries = [...prev];
          newEntries[existingIndex] = merged;
          // Move to front
          newEntries.splice(existingIndex, 1);
          newEntries.unshift(merged);
          return newEntries;
        }

        // Add new entry at the front
        const newEntries = [newEntry, ...prev];

        // Enforce max size - remove oldest non-favorite entries first
        if (newEntries.length > MAX_HISTORY_SIZE) {
          // Find non-favorite entries from the end
          const nonFavoriteIndices: number[] = [];
          for (let i = newEntries.length - 1; i >= 0; i--) {
            if (!newEntries[i].isFavorite) {
              nonFavoriteIndices.push(i);
            }
          }

          // Remove oldest non-favorites until we're at max size
          const toRemove = newEntries.length - MAX_HISTORY_SIZE;
          const indicesToRemove = nonFavoriteIndices.slice(0, toRemove);

          if (indicesToRemove.length > 0) {
            return newEntries.filter((_, i) => !indicesToRemove.includes(i));
          }

          // If all are favorites, we can't remove any - just truncate to max
          return newEntries.slice(0, MAX_HISTORY_SIZE);
        }

        return newEntries;
      });

      return id;
    },
    []
  );

  const toggleFavorite = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getEntry = useCallback(
    (id: string) => entries.find((e) => e.id === id),
    [entries]
  );

  const getEntryBySignature = useCallback(
    (signature: string) => entries.find((e) => e.signature === signature),
    [entries]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<PuzzleHistorySettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  return {
    entries,
    favorites,
    addEntry,
    toggleFavorite,
    deleteEntry,
    getEntry,
    getEntryBySignature,
    settings,
    updateSettings,
    isLoading,
  };
}

/**
 * Helper to create a history entry from game completion data
 */
export function createHistoryEntry(data: {
  cards: Card[];
  difficulty: Difficulty;
  attempts: number;
  duskValue: number;
  dawnValue: number;
  foundDusk: boolean;
  foundDawn: boolean;
  duskSubmission?: { arrangement: Card[]; result: number };
  dawnSubmission?: { arrangement: Card[]; result: number };
  source: "generated" | "shared";
  sharedFromUrl?: string;
}): Omit<PuzzleHistoryEntry, "id"> {
  const submissions: HistorySubmission[] = [];

  if (data.duskSubmission) {
    submissions.push({
      arrangement: data.duskSubmission.arrangement,
      result: data.duskSubmission.result,
      isDusk: true,
      isDawn: false,
    });
  }

  if (data.dawnSubmission) {
    // Check if it's not the same as dusk
    const isDuplicate =
      data.duskSubmission &&
      data.duskSubmission.result === data.dawnSubmission.result;

    if (!isDuplicate) {
      submissions.push({
        arrangement: data.dawnSubmission.arrangement,
        result: data.dawnSubmission.result,
        isDusk: false,
        isDawn: true,
      });
    } else if (data.duskSubmission) {
      // Same submission found both - update the dusk entry
      submissions[0].isDawn = true;
    }
  }

  return {
    cards: data.cards,
    signature: toCanonicalSignature(data.cards),
    difficulty: data.difficulty,
    attempts: data.attempts,
    submissions,
    completedAt: Date.now(),
    duskValue: data.duskValue,
    dawnValue: data.dawnValue,
    foundDusk: data.foundDusk,
    foundDawn: data.foundDawn,
    isFavorite: false,
    source: data.source,
    sharedFromUrl: data.sharedFromUrl,
  };
}
