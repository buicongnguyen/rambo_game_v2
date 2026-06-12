import { describe, expect, it } from 'vitest';
import { ENEMY_STATS } from './enemyStats';
import { STAGES } from './stages';

/**
 * Data invariants the scene relies on. v1 shipped ~50 spawns embedded in
 * obstacle rects, spawns past the boss trigger, and divergent dead boss
 * configs — these tests keep the stage data honest from now on.
 */
describe('stage data invariants', () => {
  it('has globally unique stage, encounter, and spawn ids', () => {
    const seen = new Set<string>();
    for (const stage of STAGES) {
      expect(seen.has(stage.id), `duplicate stage id ${stage.id}`).toBe(false);
      seen.add(stage.id);
      for (const encounter of stage.encounters) {
        expect(seen.has(encounter.id), `duplicate encounter id ${encounter.id}`).toBe(false);
        seen.add(encounter.id);
        for (const spawn of encounter.enemies) {
          expect(seen.has(spawn.id), `duplicate spawn id ${spawn.id}`).toBe(false);
          seen.add(spawn.id);
        }
      }
    }
  });

  it('keeps encounter triggers ascending and ahead of the boss trigger', () => {
    for (const stage of STAGES) {
      let previousTrigger = 0;
      for (const encounter of stage.encounters) {
        expect(encounter.triggerX, `${encounter.id} trigger order`).toBeGreaterThan(previousTrigger);
        expect(encounter.triggerX, `${encounter.id} vs boss trigger`).toBeLessThan(stage.bossTriggerX);
        previousTrigger = encounter.triggerX;
      }
    }
  });

  it('keeps every spawn inside the world and before the boss arena', () => {
    for (const stage of STAGES) {
      for (const encounter of stage.encounters) {
        for (const spawn of encounter.enemies) {
          expect(spawn.x, `${spawn.id} x`).toBeGreaterThan(40);
          expect(spawn.x, `${spawn.id} x`).toBeLessThan(stage.worldWidth - 40);
          expect(spawn.y, `${spawn.id} y`).toBeGreaterThan(60);
          expect(spawn.y, `${spawn.id} y`).toBeLessThan(stage.worldHeight - 60);
          expect(spawn.x, `${spawn.id} spills into the boss arena`).toBeLessThanOrEqual(stage.bossTriggerX);
          expect(ENEMY_STATS[spawn.kind], `${spawn.id} kind ${spawn.kind}`).toBeDefined();
        }
      }
    }
  });

  it('keeps obstacles inside the world', () => {
    for (const stage of STAGES) {
      for (const obstacle of stage.obstacles) {
        expect(obstacle.x - obstacle.width * 0.5).toBeGreaterThanOrEqual(0);
        expect(obstacle.x + obstacle.width * 0.5).toBeLessThanOrEqual(stage.worldWidth);
        expect(obstacle.y - obstacle.height * 0.5).toBeGreaterThanOrEqual(0);
        expect(obstacle.y + obstacle.height * 0.5).toBeLessThanOrEqual(stage.worldHeight);
      }
    }
  });

  it('places bosses past their trigger with sane combat numbers', () => {
    for (const stage of STAGES) {
      const configs = stage.bosses?.length ? stage.bosses : [stage.boss];
      for (const boss of configs) {
        expect(boss.x, `${boss.name} x`).toBeGreaterThan(stage.bossTriggerX);
        expect(boss.health, `${boss.name} health`).toBeGreaterThan(0);
        expect(boss.speed, `${boss.name} speed`).toBeGreaterThan(0);
        expect(boss.fireRate, `${boss.name} fireRate`).toBeGreaterThan(0);
        expect(boss.bulletSpeed, `${boss.name} bulletSpeed`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the single-boss fallback in sync with the lead of bosses[]', () => {
    for (const stage of STAGES) {
      if (!stage.bosses?.length) {
        continue;
      }

      const lead = stage.bosses[0];
      expect(stage.boss.kind, stage.id).toBe(lead.kind);
      expect(stage.boss.name, stage.id).toBe(lead.name);
      expect(stage.boss.health, stage.id).toBe(lead.health);
    }
  });

  it('defines complete palettes and water for river themes', () => {
    for (const stage of STAGES) {
      expect(stage.palette.sky).toBeDefined();
      expect(stage.palette.ground).toBeDefined();
      expect(stage.palette.shadow).toBeDefined();
      expect(stage.palette.accent).toBeDefined();
      expect(stage.palette.obstacle).toBeDefined();
      if (stage.theme === 'river') {
        expect(stage.palette.water, `${stage.id} river water tint`).toBeDefined();
      }
    }
  });
});

describe('enemy stats table', () => {
  it('provides positive core stats for every kind', () => {
    for (const [kind, stats] of Object.entries(ENEMY_STATS)) {
      expect(stats.health, `${kind} health`).toBeGreaterThan(0);
      expect(stats.bodyWidth, `${kind} bodyWidth`).toBeGreaterThan(0);
      expect(stats.bodyHeight, `${kind} bodyHeight`).toBeGreaterThan(0);
      expect(stats.spriteScale, `${kind} spriteScale`).toBeGreaterThan(0);
      expect(stats.score, `${kind} score`).toBeGreaterThan(0);
      expect(stats.visionHalfAngle, `${kind} visionHalfAngle`).toBeGreaterThan(0);
      expect(stats.visionHalfAngle, `${kind} visionHalfAngle`).toBeLessThan(Math.PI);
    }
  });

  it('only the zombie is melee-only', () => {
    for (const [kind, stats] of Object.entries(ENEMY_STATS)) {
      if (kind === 'zombie') {
        expect(stats.fireRange).toBe(0);
      } else {
        expect(stats.fireRange, `${kind} fireRange`).toBeGreaterThan(0);
        expect(stats.bulletSpeed, `${kind} bulletSpeed`).toBeGreaterThan(0);
        expect(stats.fireRate, `${kind} fireRate`).toBeGreaterThan(0);
      }
    }
  });
});
