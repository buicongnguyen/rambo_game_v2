/**
 * Pure math helpers for combat, camera, and movement. No Phaser imports so
 * the logic stays unit-testable in plain Node.
 */

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Frame-rate-independent smoothing toward a target (exponential decay). */
export function expDecayLerp(
  current: number,
  target: number,
  ratePerSecond: number,
  deltaMs: number,
): number {
  const blend = 1 - Math.exp(-ratePerSecond * (deltaMs / 1000));
  return current + (target - current) * blend;
}

/** Smallest zoom at which the camera viewport stays fully inside the world. */
export function minimumZoomToCoverWorld(
  viewWidth: number,
  viewHeight: number,
  worldWidth: number,
  worldHeight: number,
): number {
  return Math.max(viewWidth / Math.max(1, worldWidth), viewHeight / Math.max(1, worldHeight));
}

export type TerrainEffectKind = 'water' | 'high' | 'hole';

/** Speed multiplier applied to every ground mover standing on a terrain effect. */
export function terrainSpeedMultiplier(effect: TerrainEffectKind | undefined): number {
  switch (effect) {
    case 'water':
      return 0.58;
    case 'hole':
      return 0.46;
    case 'high':
      return 0.94;
    default:
      return 1;
  }
}

/**
 * Distance from a vehicle center along an exit ray at which a rider AABB no
 * longer overlaps the vehicle AABB. Arcade bodies stay axis-aligned whatever
 * the visual rotation, so clearance must be computed per axis.
 */
export function vehicleExitDistance(
  vehicleHalfWidth: number,
  vehicleHalfHeight: number,
  riderHalfWidth: number,
  riderHalfHeight: number,
  exitAngle: number,
  margin = 8,
): number {
  const cos = Math.abs(Math.cos(exitAngle));
  const sin = Math.abs(Math.sin(exitAngle));
  const clearX = cos > 1e-6 ? (vehicleHalfWidth + riderHalfWidth + margin) / cos : Number.POSITIVE_INFINITY;
  const clearY = sin > 1e-6 ? (vehicleHalfHeight + riderHalfHeight + margin) / sin : Number.POSITIVE_INFINITY;
  return Math.min(clearX, clearY);
}

/**
 * Liang-Barsky entry parameter of segment (x1,y1)->(x2,y2) into a rect.
 * Returns t in [0,1], or undefined when the segment never enters the rect.
 * Segments starting inside the rect return 0.
 */
export function segmentRectEntryT(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: RectLike,
): number | undefined {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const clips: Array<[number, number]> = [
    [-dx, x1 - rect.left],
    [dx, rect.right - x1],
    [-dy, y1 - rect.top],
    [dy, rect.bottom - y1],
  ];

  for (const [p, q] of clips) {
    if (p === 0) {
      if (q < 0) {
        return undefined;
      }
      continue;
    }

    const t = q / p;
    if (p < 0) {
      if (t > tMax) {
        return undefined;
      }
      if (t > tMin) {
        tMin = t;
      }
    } else {
      if (t < tMin) {
        return undefined;
      }
      if (t < tMax) {
        tMax = t;
      }
    }
  }

  return tMin;
}

/**
 * First entry point of a segment across many rects; undefined when the path
 * is clear. Rects containing the start point are ignored, mirroring the
 * line-of-sight rules (a muzzle pressed against cover is not blocked by it).
 */
export function clipSegmentToRects(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rects: Iterable<RectLike>,
): { x: number; y: number; t: number } | undefined {
  let best: number | undefined;

  for (const rect of rects) {
    if (x1 >= rect.left && x1 <= rect.right && y1 >= rect.top && y1 <= rect.bottom) {
      continue;
    }

    const t = segmentRectEntryT(x1, y1, x2, y2, rect);
    if (t !== undefined && (best === undefined || t < best)) {
      best = t;
    }
  }

  if (best === undefined) {
    return undefined;
  }

  return { x: x1 + (x2 - x1) * best, y: y1 + (y2 - y1) * best, t: best };
}
