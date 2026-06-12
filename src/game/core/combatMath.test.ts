import { describe, expect, it } from 'vitest';
import {
  clipSegmentToRects,
  expDecayLerp,
  minimumZoomToCoverWorld,
  segmentRectEntryT,
  terrainSpeedMultiplier,
  vehicleExitDistance,
} from './combatMath';

describe('expDecayLerp', () => {
  it('approaches the target monotonically', () => {
    let value = 0;
    let previousGap = 100;
    for (let step = 0; step < 20; step += 1) {
      value = expDecayLerp(value, 100, 5, 16.7);
      const gap = Math.abs(100 - value);
      expect(gap).toBeLessThan(previousGap);
      previousGap = gap;
    }
  });

  it('is frame-rate independent: one 100ms step equals two 50ms steps', () => {
    const oneStep = expDecayLerp(0, 100, 5, 100);
    const twoSteps = expDecayLerp(expDecayLerp(0, 100, 5, 50), 100, 5, 50);
    expect(oneStep).toBeCloseTo(twoSteps, 10);
  });

  it('returns the current value for zero delta', () => {
    expect(expDecayLerp(42, 100, 5, 0)).toBe(42);
  });
});

describe('minimumZoomToCoverWorld', () => {
  it('keeps a 1280x720 view inside a 2600x920 world', () => {
    const zoom = minimumZoomToCoverWorld(1280, 720, 2600, 920);
    expect(zoom).toBeCloseTo(720 / 920, 5);
    expect(1280 / zoom).toBeLessThanOrEqual(2600 + 1e-9);
    expect(720 / zoom).toBeLessThanOrEqual(920 + 1e-9);
  });

  it('exceeds 1 when the viewport is larger than the world', () => {
    expect(minimumZoomToCoverWorld(3440, 1440, 2600, 920)).toBeGreaterThan(1);
  });
});

describe('terrainSpeedMultiplier', () => {
  it('matches the tuned values', () => {
    expect(terrainSpeedMultiplier('water')).toBeCloseTo(0.58);
    expect(terrainSpeedMultiplier('hole')).toBeCloseTo(0.46);
    expect(terrainSpeedMultiplier('high')).toBeCloseTo(0.94);
    expect(terrainSpeedMultiplier(undefined)).toBe(1);
  });
});

describe('vehicleExitDistance', () => {
  const tankHalfWidth = 46;
  const tankHalfHeight = 27;
  const riderHalfWidth = 10;
  const riderHalfHeight = 8;

  it('clears the vehicle AABB for every exit angle', () => {
    for (let step = 0; step < 64; step += 1) {
      const angle = (step / 64) * Math.PI * 2;
      const distance = vehicleExitDistance(tankHalfWidth, tankHalfHeight, riderHalfWidth, riderHalfHeight, angle, 4);
      const clearedX = Math.abs(distance * Math.cos(angle)) > tankHalfWidth + riderHalfWidth;
      const clearedY = Math.abs(distance * Math.sin(angle)) > tankHalfHeight + riderHalfHeight;
      expect(clearedX || clearedY, `angle ${angle.toFixed(2)} left the rider inside the vehicle`).toBe(true);
    }
  });

  it('beats the v1 fixed 42px offset for a horizontal tank exit', () => {
    // v1 regression: exiting a tank facing along X placed the player 42px
    // away while the combined half-extents required >56px -> instant re-board.
    const distance = vehicleExitDistance(tankHalfWidth, tankHalfHeight, riderHalfWidth, riderHalfHeight, Math.PI, 8);
    expect(distance).toBeGreaterThan(56);
  });
});

describe('segmentRectEntryT', () => {
  const rect = { left: 10, top: 10, right: 20, bottom: 20 };

  it('finds the entry point of a crossing segment', () => {
    const t = segmentRectEntryT(0, 15, 30, 15, rect);
    expect(t).toBeCloseTo(10 / 30, 5);
  });

  it('returns undefined for a miss', () => {
    expect(segmentRectEntryT(0, 0, 30, 5, rect)).toBeUndefined();
    expect(segmentRectEntryT(0, 25, 30, 25, rect)).toBeUndefined();
  });

  it('returns 0 when the segment starts inside', () => {
    expect(segmentRectEntryT(15, 15, 40, 15, rect)).toBe(0);
  });

  it('returns undefined when the segment stops short of the rect', () => {
    expect(segmentRectEntryT(0, 15, 5, 15, rect)).toBeUndefined();
  });
});

describe('clipSegmentToRects', () => {
  const near = { left: 10, top: -5, right: 14, bottom: 5 };
  const far = { left: 30, top: -5, right: 34, bottom: 5 };

  it('clips at the nearest blocking rect', () => {
    const hit = clipSegmentToRects(0, 0, 50, 0, [far, near]);
    expect(hit).toBeDefined();
    expect(hit!.x).toBeCloseTo(10, 5);
    expect(hit!.y).toBeCloseTo(0, 5);
  });

  it('ignores rects containing the start point (muzzle pressed against cover)', () => {
    const hit = clipSegmentToRects(12, 0, 50, 0, [near, far]);
    expect(hit).toBeDefined();
    expect(hit!.x).toBeCloseTo(30, 5);
  });

  it('returns undefined on a clear path', () => {
    expect(clipSegmentToRects(0, 20, 50, 20, [near, far])).toBeUndefined();
  });
});
