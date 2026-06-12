# Operation Iron Vengeance — Version 2 Plan

Research completed June 12, 2026. Sources: full line-by-line review of `BattleScene.ts` (~5,000
lines), `stages.ts`, UI/input/audio modules, plus Phaser 3.90 documentation, release notes, and
community guidance (see "Web research" below).

## Goals

1. **Better physics** — frame-rate-independent, no tunneling, no teleport hacks, hitboxes that
   match visuals, collisions that behave the same at 30/60/144 FPS.
2. **Better logic** — no outcome races, no dead mechanics, no copy-paste drift between damage
   paths, data-driven enemy tuning.
3. **No background/rendering bugs** — the camera can never see outside the painted world at any
   window size; parallax depth; stable UI under zoom/shake.
4. Ship as `rambo_game_v2` on GitHub with working CI.

## Root causes identified in v1

### Physics (BattleScene.ts)
- **Bullets bypass the physics engine.** `configureBulletBody` zeroes real body velocity; bullets
  are teleported per frame with `setPosition` + `body.reset` using velocity stored in data, so
  Arcade has no previous-position sweep → tunneling through 28 px walls/16 px bodies whenever the
  per-frame step grows (sniper 860 px/s × 50 ms clamped step ≈ 43–60 px). Fix: give bullets real
  `body.velocity` (px/sec, already delta-integrated by Arcade), keep `fixedStep: true`, raise
  `physics.world.setFPS(120)`, and use compact square bullet bodies instead of 28×5 boxes that
  never rotate with travel direction.
- **Mixed time bases.** Bullet motion uses a 50 ms-clamped delta while expiry uses wall-clock
  `time` → max range silently shrinks on slow devices. Drop sink `bullet.y += dropProgress * 0.9`
  is per-frame (54 px/s @60 Hz, 130 px/s @144 Hz). Crosswind adds `drift * seconds * 8` inside a
  velocity that is multiplied by `seconds` again (∝ delta²). Fix: all bullet kinematics expressed
  as px/sec velocities; expiry from distance budget on the same integration.
- **Vehicle exit lands inside the vehicle AABB** (offset 42 px < tank half-width 46 + player half
  16) and `handleVehicleEntry` has no cooldown → instant re-board, player trapped. Fix: exit
  offset from body half-extents + re-entry cooldown; disable rider body while mounted.
- **Camera-edge clamp teleports actors** with `body.reset` (zeroes velocity, can shove players
  into obstacles when the high-ground zoom effect moves the view edge). Fix: positional clamp that
  preserves velocity and never overrides obstacle separation.
- **Frame-rate-dependent smoothing.** Camera zoom lerp `setZoom(Linear(zoom, target, 0.08))` per
  frame. Fix: exponential-decay smoothing helper `expDecayLerp(current, target, rate, deltaMs)`.
- **Hitboxes ≪ visuals.** Tank raider body 49×27 vs ~84×57 drawn; bosses 72×40 vs 138–168 px
  visuals. Fix: per-kind body sizes derived from visual extents (data table).
- **Terrain affects only players.** Water/hole multipliers ignored by enemies/allies/vehicles.
  Fix: shared `getTerrainSpeedMultiplier(x, y)` applied to every ground mover.
- **Jump neither dodges nor costs.** No i-frames while airborne, but jumping into soft cover
  destroys it instantly for free. Fix: airborne window grants dodge vs bullets/contact (with
  shadow + scale arc), vault damages cover instead of deleting it.

### Logic (BattleScene.ts, GameDirector.ts)
- **Outcome race.** `completeCurrentStage` (T+1100) and `failMission` (T+900) are scheduled by
  unguarded delayed calls while poison-cloud pulses (+1290 ms) and dart ticks (+420 ms) keep
  dealing damage → game-over can flip to victory and vice versa. Fix: one-way `stageOutcome`
  latch checked by all damage handlers + delayed callbacks; `GameDirector` ignores transitions
  unless `phase === 'playing'`; Skip Stage disabled once the outcome is latched.
- **Rescue bunkers are solid obstacles**, so the player↔bunker collider separates bodies to
  exact-touching every step and the rescue *overlap* never fires — Shadow Squad allies can never
  spawn. Fix: bunkers stop being solid obstacles; rescue triggers by proximity.
- **Bomb cap mismatch**: encounter clear does `min(bombs + 1, 5)` while pickups cap at 12 →
  clearing a zone confiscates stockpiled bombs. Fix: single cap (12), reward never decreases.
- **Hit flash erases identity.** `clearTint()` after `setTintFill(white)` removes the spawn tint
  that distinguishes zombies/scouts/raiders/bosses (shared rifleman texture). Fix: store
  `baseTint` at spawn; restore it.
- **Zombie bite bypasses** the vehicle redirect and global contact cooldown used by every other
  contact path (copy-paste drift). Fix: one melee-contact helper.
- **Laser ignores all occlusion** (segment-distance damage through walls). Fix: clip beam at
  first obstacle intersection.
- **Splash double-dips** the directly-hit enemy (launcher 135 + 70). Fix: exclude the impact
  target from its own explosion.
- **Auto-aim targets spawn-tweening enemies** whose bodies are disabled (bullets sail through).
  Fix: require enabled body in target selection.
- **Iteration bugs**: `updateBullets` destroys bullets inside `for…of group.getChildren()`
  (live array) → skipped updates; duplicate manual bullet-vs-vehicle scan next to the registered
  overlap. Fix: iterate copies; delete the duplicate path.
- **~50 enemy spawn points sit inside obstacle rectangles** (worst: `dm3-tank1` exactly at an
  obstacle center) → buried/shielded enemies can stall encounter progression. Fix: runtime spawn
  relocation to the nearest open spot.
- **Per-obstacle collider web**: 6 colliders × ~65 obstacles created per stage; destroying a
  destructible leaves its colliders registered forever. Fix: one static group + one collider per
  moving group; destructible death removes the member.
- Minor: duplicate boss-summon IDs break pierce bookkeeping; zero-length aim vectors spawn
  stationary invisible bullets; pickups don't check `active`; HUD emitted during pause window.

### Background / camera / rendering (BattleScene.ts, main.ts)
- **The background void** (the reported "background image bug"): `drawBackdrop` paints the ground
  to `max(worldHeight, viewportHeight/zoom)` **once at create time**; the scale-RESIZE handler
  only re-zooms and never repaints, and the base zoom is clamped to fit world *height* only in
  the (practically dead) portrait branch. Growing the window, closing devtools, rotating, or a
  ≥1440p display exposes unpainted sky-colored void and a dead band pinned under the bottom wall.
  Fix (invariant, not patch): paint exactly `worldWidth × worldHeight`, and enforce
  `zoom ≥ max(viewW/worldW, viewH/worldH)` (`getMinimumPlayableZoom`) in **both** the responsive
  zoom and the high-ground zoom effect, so the camera mathematically can never see outside the
  painted world at any window size.
- **Backdrop decoration loops hardcoded** for ~2600×800 worlds → late stages (3180–3520 wide)
  end in featureless flat color. Fix: derive decoration counts/positions from stage dimensions.
- **Parallax**: none today. Add viewport-sized `TileSprite` layers (`setScrollFactor(0)`,
  `tilePositionX = camera.scrollX × factor`, resized on RESIZE) — the device-independent pattern
  recommended by Phaser docs (scrollFactor-based parallax is viewport-dependent, phaser#6128).
- **Overlay UI scales with zoom/shake** (`scrollFactor(0)` skips scroll, not zoom). Fix:
  counter-scale overlay text by `1/zoom` and re-layout from `worldView`.
- **Standby screen** reuses gameplay banner fields (resize re-layouts hijack the briefing) and
  spawns menu preview actors outside small viewports. Fix: dedicated standby layout pass.
- **Damage numbers** allocate a new `Text` (canvas + GPU upload) per hit (~35/s sustained).
  Fix: pooled label set.
- Keep `antialias` (Text objects would crunch under nearest filtering) but snap responsive zoom
  to discrete steps and use exp-decay zoom smoothing to reduce shimmer.

### Data / UI / build
- `stages.ts`: stages 3/6/9 carry a dead, divergent `boss` config next to `bosses[]` (menu
  preview reads the wrong health); two spawns sit past `bossTriggerX`.
- `InterfaceController`: full innerHTML rebuild up to ~8×/s during combat (recreates the Skip
  button mid-tap; raw `bombCooldownMs` busts the render signature every emit). Fix: build the HUD
  DOM once, patch text/widths in place.
- `BattleMusic`: no stop/pause API (plays through game over; background tabs stutter);
  `AudioContext` bare-identifier fallback throws where it should fall back. Fix: stop()/suspend
  on `visibilitychange`, `window.AudioContext ?? webkitAudioContext`.
- TouchControls: second finger steals the stick; `(hover:none)` media query has no `change`
  listener.
- `tsconfig`: `strict` missing entirely — enable and fix fallout.
- Dead weight: `src/counter.ts`, template assets, unused `.mid`, `getStageThemeById` (stale),
  ~142 generator-intermediate PNGs shipped into every build (move out of `public/`).
- CI: `android/`, `capacitor.config.ts`, docs and the APK workflow were never committed → the
  workflow fails at `cap sync`. Commit them together; keep Pages workflow (`base: './'` already
  works for a renamed repo).

## Web research that shaped the plan (key sources)

- Arcade `Body.velocity` is px/sec and integrated on a fixed timestep — manual per-frame
  `x += n` is the only frame-rate-dependent pattern; `world.setFPS()` shrinks per-step travel
  (tunneling) — docs.phaser.io TimeStep / Arcade World / Arcade Body.
- Pooled bullet groups: `maxSize`, `get()` → null check, `killAndHide` + `disableBody(true,true)`
  — docs.phaser.io Groups; ourcade.co object pools.
- RESIZE-mode contract: handle `scale.on('resize')`, never cache viewport sizes, re-anchor UI —
  docs.phaser.io Scale Manager; netexl RESIZE guide.
- Parallax: scrollFactor(0) tileSprites + `tilePositionX = scrollX * f` (viewport-independent),
  phaser.io parallax tutorial; phaser#6128.
- Scene lifecycle: clean external listeners in `SHUTDOWN`; anims/textures are global → guard with
  `exists()` — phaser#4209; Scenes events docs.
- Smoothing: exponential decay for zoom/follow lerps; keep zoom integral when roundPixels is on
  (phaser#6509) — we therefore pass `roundPixels: false` to follow and snap zoom steps.
- Phaser 3.90.0 is the final v3 release (no patches coming) — pin it; all listed 3.85–3.89
  regressions (anim frameRate, group collisionMask, circle separation) are fixed in 3.90.

## Implementation phases

Each phase ends with `tsc && vite build` green; gameplay-affecting phases also get a manual
preview run (screenshots at multiple window sizes, console clean).

1. **Identity & hygiene** — rename to `rambo_game_v2`, README v2 rewrite, delete dead files,
   relocate generator intermediates, commit Capacitor/Android/CI files, enable `strict`.
2. **Projectile system rebuild** — real arcade velocities, `setFPS(120)`, square bodies, single
   time base, delta-correct drop/wind/boost zones, pooled groups, overlap-based impacts, laser
   occlusion, splash/pierce fixes, safe iteration.
3. **Movement & vehicles** — extent-based vehicle exit + board cooldown + disabled rider body,
   universal terrain modifiers, velocity-preserving containment, exp-decay camera smoothing,
   per-kind hitbox table, jump dodge (i-frames + shadow) and vault rework.
4. **Outcome state machine & logic fixes** — `stageOutcome` latch, director phase guards, rescue
   bunker fix (proximity-based), bomb cap, base-tint restore, unified melee contact, aim-assist
   body checks, spawn de-embedding, static-group colliders, summon IDs, encounter accounting.
5. **Background & camera rebuild** — world-sized backdrop with dimension-derived decoration,
   zoom-floor invariant everywhere, parallax tileSprite layers, overlay counter-scaling, standby
   layout, pooled damage text, depth constants.
6. **UI / audio / data polish** — incremental HUD DOM, honest mode labels, music stop API +
   autoplay fallback fix, touch fixes, stage data cleanup.
7. **Verification & release** — automated unit tests for extracted pure helpers (vitest),
   full-size/small-size/resize screenshot matrix, console error sweep, push to
   `github.com/buicongnguyen/rambo_game_v2` with Pages + APK workflows.

## Non-goals for v2

- True simultaneous local 2-player (v1's "2P" intentionally became Shadow Squad mode; v2 makes
  the squad actually work and labels the mode honestly instead).
- Phaser 4 migration (3.90 pinned; migration is a v3 follow-up).
- New art/levels beyond decoration scaling (same 9 stages, same sprite pipeline).
