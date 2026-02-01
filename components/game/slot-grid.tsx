"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import type { Card, Slot } from "@/lib/types/game";
import { calculateRowDistribution } from "@/lib/game/layout";
import { cardToString } from "@/lib/game/evaluate";
import { CardSlot } from "./card-slot";
import { GameCard } from "./game-card";

export interface SlotGridProps {
  /** Array of slots (cards or nulls) */
  slots: Slot[];
  /** Total number of slots to display */
  totalSlots: number;
  /** Zone identifier for unique IDs */
  zone: "hand" | "table";
  /** Callback when a slot is clicked */
  onSlotClick: (index: number) => void;
  /** Callback when a drag ends (swap indices) */
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  /** Whether interactions are disabled */
  disabled?: boolean;
  /** Whether this is the first card (for operator display) */
  isTableZone?: boolean;
  /** Size variant */
  size?: "normal" | "small" | "hand";
}

export function SlotGrid({
  slots,
  totalSlots,
  zone,
  onSlotClick,
  onDragEnd,
  disabled = false,
  isTableZone = false,
  size = "normal",
}: SlotGridProps) {
  // Calculate row distribution
  const [topRowCount] = useMemo(
    () => calculateRowDistribution(totalSlots),
    [totalSlots]
  );

  // Pad slots array to totalSlots length
  const paddedSlots = useMemo(() => {
    const result: Slot[] = [...slots];
    while (result.length < totalSlots) {
      result.push(null);
    }
    return result;
  }, [slots, totalSlots]);

  // Generate unique IDs for each slot
  const slotIds = useMemo(
    () =>
      paddedSlots.map((slot, index) => {
        if (slot === null) {
          return `${zone}-empty-${index}`;
        }
        return `${zone}-${cardToString(slot)}-${index}`;
      }),
    [paddedSlots, zone]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onDragEnd) return;

    const oldIndex = slotIds.indexOf(active.id as string);
    const newIndex = slotIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      onDragEnd(oldIndex, newIndex);
    }
  }

  // Split into rows
  const topRow = topRowCount > 0 ? paddedSlots.slice(0, topRowCount) : [];
  const topRowIds = topRowCount > 0 ? slotIds.slice(0, topRowCount) : [];
  const bottomRow = paddedSlots.slice(topRowCount);
  const bottomRowIds = slotIds.slice(topRowCount);

  const renderSlot = (slot: Slot, index: number, slotId: string) => {
    const isEmpty = slot === null;
    // For table zone, first non-null card is "first" for operator display
    const isFirst =
      isTableZone &&
      slot !== null &&
      paddedSlots.filter((s): s is Card => s !== null).indexOf(slot) === 0;

    return (
      <CardSlot
        key={slotId}
        id={slotId}
        isEmpty={isEmpty}
        size={size}
        onClick={isEmpty ? () => onSlotClick(index) : undefined}
      >
        {slot && (
          <GameCard
            id={slotId}
            card={slot}
            isFirst={isFirst}
            disabled={disabled}
            draggable={!disabled && !!onDragEnd}
            onClick={() => onSlotClick(index)}
            size={size}
          />
        )}
      </CardSlot>
    );
  };

  const content = (
    <div className="flex flex-col items-center gap-2 w-full">
      {topRowCount > 0 && (
        <div className="flex justify-center gap-2 sm:gap-3">
          {topRow.map((slot, i) => renderSlot(slot, i, topRowIds[i]))}
        </div>
      )}
      <div className="flex justify-center gap-2 sm:gap-3">
        {bottomRow.map((slot, i) =>
          renderSlot(slot, topRowCount + i, bottomRowIds[i])
        )}
      </div>
    </div>
  );

  // Wrap with DndContext if drag is enabled
  if (onDragEnd && !disabled) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slotIds} strategy={rectSortingStrategy}>
          {content}
        </SortableContext>
      </DndContext>
    );
  }

  return content;
}
