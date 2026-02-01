/**
 * Layout utilities for card slot system
 */

/**
 * Calculate row distribution for slot grid (bottom-heavy)
 * @param total - Total number of slots
 * @returns [topRowCount, bottomRowCount]
 *
 * Examples:
 * - 4 cards → [0, 4] (single row)
 * - 5 cards → [0, 5] (single row)
 * - 6 cards → [3, 3] (two equal rows)
 * - 7 cards → [3, 4] (bottom-heavy)
 * - 8 cards → [4, 4] (two equal rows)
 * - 10 cards → [5, 5] (two equal rows)
 */
export function calculateRowDistribution(total: number): [number, number] {
  if (total <= 5) {
    return [0, total]; // Single row
  }
  const half = Math.floor(total / 2);
  return [half, total - half]; // e.g., 7 → [3, 4]
}
