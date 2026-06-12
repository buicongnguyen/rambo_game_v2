import type { EnemyKind } from '../types';

/**
 * One table for every per-kind tuning value. Body sizes are expressed in
 * world pixels (the scene divides by sprite scale before calling setSize, so
 * the physical hitbox matches what the player sees regardless of scale).
 */
export interface EnemyStats {
  health: number;
  moveSpeed: number;
  /** ms between shots */
  fireRate: number;
  /** px/s */
  bulletSpeed: number;
  damage: number;
  /** desired world-space hitbox */
  bodyWidth: number;
  bodyHeight: number;
  spriteScale: number;
  tint?: number;
  depth: number;
  score: number;
  /** 0 = melee only; matches the drawn vision cone so threats read honestly */
  fireRange: number;
  visionHalfAngle: number;
  /** preferred standoff distance; 0 = chase to contact */
  desiredRange: number;
  fireSpread: number;
  bulletTint: number;
  strafePeriodMs: number;
  strafeAmount: number;
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  rifleman: {
    health: 50,
    moveSpeed: 62,
    fireRate: 900,
    bulletSpeed: 300,
    damage: 10,
    bodyWidth: 16,
    bodyHeight: 14,
    spriteScale: 1,
    depth: 11,
    score: 100,
    fireRange: 360,
    visionHalfAngle: 0.42,
    desiredRange: 190,
    fireSpread: 0.05,
    bulletTint: 0xff5b4a,
    strafePeriodMs: 520,
    strafeAmount: 0.28,
  },
  rocketeer: {
    health: 85,
    moveSpeed: 48,
    fireRate: 1400,
    bulletSpeed: 265,
    damage: 18,
    bodyWidth: 16,
    bodyHeight: 14,
    spriteScale: 1,
    depth: 11,
    score: 140,
    fireRange: 470,
    visionHalfAngle: 0.42,
    desiredRange: 280,
    fireSpread: 0.12,
    bulletTint: 0xff9359,
    strafePeriodMs: 520,
    strafeAmount: 0.28,
  },
  turret: {
    health: 130,
    moveSpeed: 0,
    fireRate: 1050,
    bulletSpeed: 340,
    damage: 12,
    bodyWidth: 20,
    bodyHeight: 14,
    spriteScale: 1,
    depth: 8,
    score: 180,
    fireRange: 420,
    visionHalfAngle: 0.3,
    desiredRange: 0,
    fireSpread: 0.05,
    bulletTint: 0xff5b4a,
    strafePeriodMs: 520,
    strafeAmount: 0,
  },
  zombie: {
    health: 28,
    moveSpeed: 96,
    fireRate: 0,
    bulletSpeed: 0,
    damage: 8,
    bodyWidth: 11,
    bodyHeight: 12,
    spriteScale: 0.84,
    tint: 0x9bdc73,
    depth: 11,
    score: 45,
    fireRange: 0,
    visionHalfAngle: 0.62,
    desiredRange: 0,
    fireSpread: 0,
    bulletTint: 0x9cff8a,
    strafePeriodMs: 0,
    strafeAmount: 0,
  },
  scout: {
    health: 24,
    moveSpeed: 96,
    fireRate: 1520,
    bulletSpeed: 280,
    damage: 14,
    bodyWidth: 9,
    bodyHeight: 10,
    spriteScale: 0.72,
    tint: 0x93ffcb,
    depth: 11,
    score: 100,
    fireRange: 430,
    visionHalfAngle: 0.52,
    desiredRange: 260,
    fireSpread: 0.08,
    bulletTint: 0x8cff6a,
    strafePeriodMs: 360,
    strafeAmount: 0.62,
  },
  bikeRaider: {
    health: 80,
    moveSpeed: 128,
    fireRate: 1180,
    bulletSpeed: 310,
    damage: 10,
    bodyWidth: 44,
    bodyHeight: 18,
    spriteScale: 0.7,
    tint: 0xff795c,
    depth: 14,
    score: 150,
    fireRange: 330,
    visionHalfAngle: 0.46,
    desiredRange: 245,
    fireSpread: 0.1,
    bulletTint: 0xff8a5c,
    strafePeriodMs: 340,
    strafeAmount: 0.36,
  },
  jeepRaider: {
    health: 260,
    moveSpeed: 94,
    fireRate: 980,
    bulletSpeed: 340,
    damage: 14,
    bodyWidth: 60,
    bodyHeight: 30,
    spriteScale: 0.7,
    tint: 0xff9f5c,
    depth: 14,
    score: 240,
    fireRange: 430,
    visionHalfAngle: 0.4,
    desiredRange: 320,
    fireSpread: 0.08,
    bulletTint: 0xffd08a,
    strafePeriodMs: 520,
    strafeAmount: 0.36,
  },
  tankRaider: {
    health: 560,
    moveSpeed: 54,
    fireRate: 1420,
    bulletSpeed: 300,
    damage: 22,
    bodyWidth: 80,
    bodyHeight: 48,
    spriteScale: 0.64,
    tint: 0xffc17d,
    depth: 14,
    score: 360,
    fireRange: 560,
    visionHalfAngle: 0.34,
    desiredRange: 420,
    fireSpread: 0.09,
    bulletTint: 0xffb35c,
    strafePeriodMs: 520,
    strafeAmount: 0.16,
  },
};
